import { APP_BASE_HREF } from '@angular/common';
import { CommonEngine } from '@angular/ssr/node';
import express from 'express';
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
// breaks — script-src 'self' already blocks the injection vector either way.
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
};

// The Express app is exported so that it can be used by serverless Functions.
export function app(): express.Express {
  const server = express();
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
  server.use((_req, res, next) => {
    for (const [name, value] of Object.entries(SECURITY_HEADERS)) {
      res.setHeader(name, value);
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

  return server;
}

function run(): void {
  const port = process.env['PORT'] || 4000;

  // Fail loudly (but don't crash) if the canonical origin is missing in production —
  // otherwise the SSR URL silently falls back to the untrusted, spoofable Host header.
  if (process.env['NODE_ENV'] === 'production' && !process.env['APP_ORIGIN']) {
    console.warn(
      '[security] APP_ORIGIN is not set: SSR will fall back to the untrusted Host header. ' +
      'Set APP_ORIGIN to this deployment\'s canonical origin (e.g. https://shop.example.com).'
    );
  }

  // Start up the Node server
  const server = app();
  server.listen(port, () => {
    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

run();
