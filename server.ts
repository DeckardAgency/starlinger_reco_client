import { APP_BASE_HREF } from '@angular/common';
import { CommonEngine } from '@angular/ssr/node';
import express, { NextFunction, Request, Response } from 'express';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import bootstrap from './src/main.server';

// Content-Security-Policy and companion hardening headers. The app loads no inline
// executable scripts, so script-src can stay 'self'. Angular hydration is enabled but
// its state transfer is a non-executable <script type="application/json"> block, which
// script-src does not block. Do NOT add withEventReplay() to provideClientHydration
// without adding a nonce here — it injects an inline event-recording script that this
// policy would block. Component styles are injected as <style> tags, hence style-src
// needs 'unsafe-inline'. Google Fonts are allowed explicitly.
//
// API_ORIGIN pins connect-/img-src to the exact backend origin (e.g.
// https://api.example.com) so the policy can't be abused to beacon to arbitrary hosts.
// When it's unset (local dev), we fall back to the generic `https:` allowance so nothing
// breaks — script-src 'self' already blocks the injection vector either way. A production
// start without it logs a warning (see run()).
const API_ORIGIN = process.env['API_ORIGIN'];
const CONNECT_SRC = API_ORIGIN ? `'self' ${API_ORIGIN}` : "'self' https:";
const IMG_SRC = API_ORIGIN ? `'self' data: blob: ${API_ORIGIN}` : "'self' data: blob: https:";

const SECURITY_HEADERS: Record<string, string> = {
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com data:",
    `img-src ${IMG_SRC}`,
    `connect-src ${CONNECT_SRC}`,
    "object-src 'none'",
    "base-uri 'self'",
    "frame-ancestors 'none'",
    "form-action 'self'",
  ].join('; '),
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
  'Cross-Origin-Opener-Policy': 'same-origin',
};

// TLS terminates at the reverse proxy in front of this app (which itself listens on plain
// HTTP), so the original scheme is only known from X-Forwarded-Proto. HSTS is sent on
// HTTPS requests only — browsers ignore it over plain HTTP, and local dev stays clean.
const HSTS_VALUE = 'max-age=31536000';

function isHttpsRequest(req: Request): boolean {
  const forwarded = req.headers['x-forwarded-proto'];
  const proto = (Array.isArray(forwarded) ? forwarded[0] : forwarded)?.split(',')[0].trim().toLowerCase();
  return proto === 'https';
}

// The Express app is exported so that it can be used by serverless Functions.
export function app(): express.Express {
  const server = express();
  server.disable('x-powered-by');
  const serverDistFolder = dirname(fileURLToPath(import.meta.url));
  const browserDistFolder = resolve(serverDistFolder, '../browser');
  const indexHtml = join(serverDistFolder, 'index.server.html');

  // CommonEngine rejects render URLs whose hostname isn't allowlisted (falls back
  // to CSR otherwise). Allow local hosts plus the canonical deployment origin.
  const allowedHosts = ['localhost', '127.0.0.1'];
  const appOrigin = process.env['APP_ORIGIN'];
  if (appOrigin) {
    try {
      allowedHosts.push(new URL(appOrigin).hostname);
    } catch {
      console.warn(`[ssr] APP_ORIGIN is not a valid URL: ${appOrigin}`);
    }
  }
  const commonEngine = new CommonEngine({ allowedHosts });

  server.set('view engine', 'html');
  server.set('views', browserDistFolder);

  // Send security headers on every response.
  server.use((req, res, next) => {
    for (const [name, value] of Object.entries(SECURITY_HEADERS)) {
      res.setHeader(name, value);
    }
    if (isHttpsRequest(req)) {
      res.setHeader('Strict-Transport-Security', HSTS_VALUE);
    }
    next();
  });

  // Example Express Rest API endpoints
  // server.get('/api/**', (req, res) => { });
  // Serve static files from /browser. Angular's build output is content-hashed
  // (e.g. main-ABC12345.js) and safe to cache for a year; non-hashed files copied
  // from public/ (images, favicon, ...) get a shorter 7-day lifetime so they can
  // actually be updated.
  const CONTENT_HASH_RE = /-[A-Z0-9]{8}\./;
  server.get('**', express.static(browserDistFolder, {
    maxAge: '1y',
    index: 'index.html',
    setHeaders: (res, filePath) => {
      if (!CONTENT_HASH_RE.test(filePath)) {
        res.setHeader('Cache-Control', 'public, max-age=604800');
      }
    },
  }));

  // All regular routes use the Angular engine
  server.get('**', (req, res, next) => {
    const { protocol, originalUrl, baseUrl, headers } = req;

    // Prefer a configured, trusted origin over the client-supplied Host header, which
    // is attacker-controllable and could otherwise poison absolute URLs / caches.
    const origin = process.env['APP_ORIGIN'] ?? `${protocol}://${headers.host}`;

    commonEngine
      .render({
        bootstrap,
        documentFilePath: indexHtml,
        url: `${origin}${originalUrl}`,
        publicPath: browserDistFolder,
        providers: [{ provide: APP_BASE_HREF, useValue: baseUrl }],
      })
      .then((html) => res.send(html))
      .catch((err) => next(err));
  });

  // Final error handler (must stay last, and keep its four arguments — that is how
  // Express recognises it). The error is logged server-side only; the client always gets
  // the same generic body, never a stack trace, whatever NODE_ENV is.
  server.use((err: unknown, req: Request, res: Response, next: NextFunction) => {
    console.error(`[ssr] Unhandled error for ${req.method} ${req.originalUrl}:`, err);
    if (res.headersSent) {
      // Too late for a clean response; let Express abort the connection.
      next(err);
      return;
    }
    res.status(500).type('text/plain').send('Internal Server Error');
  });

  return server;
}

function run(): void {
  const port = process.env['PORT'] || 4000;

  // Fail loudly (but don't crash) if deployment configuration is missing in production.
  if (process.env['NODE_ENV'] === 'production') {
    // Without it the SSR URL silently falls back to the untrusted, spoofable Host header.
    if (!process.env['APP_ORIGIN']) {
      console.warn(
        '[security] APP_ORIGIN is not set: SSR will fall back to the untrusted Host header. ' +
        'Set APP_ORIGIN to this deployment\'s canonical origin (e.g. https://shop.example.com).'
      );
    }
    // Without it the CSP allows connections and images to ANY https: host.
    if (!API_ORIGIN) {
      console.warn(
        '[security] API_ORIGIN is not set: the Content-Security-Policy falls back to allowing ' +
        'connect-src/img-src for any https: host. Set API_ORIGIN to the backend origin ' +
        '(e.g. https://api.example.com) to pin the policy to it.'
      );
    }
  }

  // Start up the Node server
  const server = app();
  server.listen(port, () => {
    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

run();
