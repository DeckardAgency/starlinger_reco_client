import { DestroyRef, Injectable, InjectionToken, NgZone, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { NavigationEnd, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { distinctUntilChanged, filter } from 'rxjs/operators';
import { environment } from '@env/environment';
import { AuthService } from './auth.service';

/** Default: sign the user out after 30 minutes without any activity. */
export const DEFAULT_IDLE_TIMEOUT_MS = 30 * 60 * 1000;

/**
 * The effective idle timeout. An environment file may override the default with an
 * optional `idleTimeoutMs` (milliseconds); none of them has to define it.
 */
export const IDLE_TIMEOUT_MS = new InjectionToken<number>('IDLE_TIMEOUT_MS', {
  providedIn: 'root',
  factory: () => {
    const configured = (environment as { idleTimeoutMs?: number }).idleTimeoutMs;
    return typeof configured === 'number' && configured > 0 ? configured : DEFAULT_IDLE_TIMEOUT_MS;
  }
});

/** localStorage key holding the time (ms since epoch) of the last activity in ANY tab. */
export const IDLE_ACTIVITY_STORAGE_KEY = 'lastActivityAt';

const ACTIVITY_EVENTS = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'wheel', 'scroll'] as const;
/** Activity is persisted at most this often — mousemove fires far more frequently. */
const RECORD_THROTTLE_MS = 5_000;
/** How often the deadline is re-checked (also bounds how late a logout can be). */
const MAX_CHECK_INTERVAL_MS = 15_000;

/**
 * Automatic logout after a period without user activity (mouse, keyboard, touch,
 * navigation), so an unattended browser does not stay signed in.
 *
 * - Browser only; on the server it does nothing.
 * - Runs only while a user is authenticated (follows AuthService.isAuthenticated$).
 * - DOM listeners and the timer are registered outside Angular, so activity never
 *   triggers change detection and the timer never blocks SSR/hydration stability.
 * - Tabs are kept in sync through one localStorage timestamp: activity in any tab keeps
 *   all of them alive, and when one tab ends the session (idle or a manual logout) it
 *   removes the timestamp, which signs the other tabs out too.
 *
 * Instantiated once at startup (see app.config.ts).
 */
@Injectable({ providedIn: 'root' })
export class IdleTimeoutService {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly zone = inject(NgZone);
  private readonly timeoutMs = inject(IDLE_TIMEOUT_MS);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  private running = false;
  private intervalId: ReturnType<typeof setInterval> | null = null;
  /** In-memory copy of the last recorded activity (fallback when storage is unavailable). */
  private lastActivityAt = 0;
  private lastRecordedAt = 0;

  private readonly onActivity = (): void => this.handleActivity();
  private readonly onStorage = (event: StorageEvent): void => this.handleStorage(event);

  constructor() {
    if (!this.isBrowser) {
      return;
    }

    this.auth.isAuthenticated$
      .pipe(distinctUntilChanged(), takeUntilDestroyed())
      .subscribe(isAuthenticated => (isAuthenticated ? this.start() : this.stop(true)));

    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd), takeUntilDestroyed())
      .subscribe(() => this.handleActivity());

    // App teardown: detach, but leave the shared timestamp for the other tabs.
    inject(DestroyRef).onDestroy(() => this.stop(false));
  }

  private start(): void {
    if (this.running) {
      return;
    }
    this.running = true;

    // A timestamp left by this session (page reload, another tab) keeps counting: coming
    // back to a tab that has been idle for too long must not revive the session.
    const stored = this.readStored();
    if (stored !== null && this.isExpired(stored)) {
      this.expire();
      return;
    }
    if (stored === null) {
      this.record(Date.now());
    } else {
      this.lastActivityAt = stored;
    }

    this.zone.runOutsideAngular(() => {
      for (const eventName of ACTIVITY_EVENTS) {
        document.addEventListener(eventName, this.onActivity, { capture: true, passive: true });
      }
      window.addEventListener('storage', this.onStorage);
      this.intervalId = setInterval(
        () => this.checkDeadline(),
        Math.min(MAX_CHECK_INTERVAL_MS, Math.max(1_000, Math.floor(this.timeoutMs / 4)))
      );
    });
  }

  /** @param forgetActivity remove the shared timestamp (the session is over in every tab). */
  private stop(forgetActivity: boolean): void {
    if (this.running) {
      this.running = false;
      for (const eventName of ACTIVITY_EVENTS) {
        document.removeEventListener(eventName, this.onActivity, { capture: true });
      }
      window.removeEventListener('storage', this.onStorage);
      if (this.intervalId !== null) {
        clearInterval(this.intervalId);
        this.intervalId = null;
      }
    }
    if (forgetActivity) {
      this.lastActivityAt = 0;
      this.lastRecordedAt = 0;
      try {
        localStorage.removeItem(IDLE_ACTIVITY_STORAGE_KEY);
      } catch { /* storage unavailable */ }
    }
  }

  private handleActivity(): void {
    if (!this.running) {
      return;
    }
    const now = Date.now();
    if (now - this.lastRecordedAt < RECORD_THROTTLE_MS) {
      return;
    }
    // Timers are throttled/suspended in background tabs and during sleep, so the first
    // interaction after a long pause may arrive before the interval noticed the deadline.
    if (this.isExpired(this.lastActivity())) {
      this.expire();
      return;
    }
    this.record(now);
  }

  private handleStorage(event: StorageEvent): void {
    // Another tab removed the timestamp: the session ended there (idle or manual logout).
    if (this.running && event.key === IDLE_ACTIVITY_STORAGE_KEY && event.newValue === null) {
      this.expire();
    }
  }

  private checkDeadline(): void {
    if (this.running && this.isExpired(this.lastActivity())) {
      this.expire();
    }
  }

  private expire(): void {
    // Back into Angular: logout updates signals/subjects and navigates.
    this.zone.run(() => {
      this.auth.logout();
      this.stop(true); // normally already done via isAuthenticated$; keeps it certain
      void this.router.navigate(['/login']);
    });
  }

  private isExpired(lastActivityAt: number): boolean {
    return Date.now() - lastActivityAt >= this.timeoutMs;
  }

  /** Latest activity across tabs: the shared timestamp, or this tab's own if unavailable. */
  private lastActivity(): number {
    return Math.max(this.readStored() ?? 0, this.lastActivityAt);
  }

  private record(now: number): void {
    this.lastActivityAt = now;
    this.lastRecordedAt = now;
    try {
      localStorage.setItem(IDLE_ACTIVITY_STORAGE_KEY, String(now));
    } catch { /* storage unavailable — this tab still tracks its own activity */ }
  }

  private readStored(): number | null {
    try {
      const raw = localStorage.getItem(IDLE_ACTIVITY_STORAGE_KEY);
      const value = raw === null ? NaN : Number(raw);
      return Number.isFinite(value) ? value : null;
    } catch {
      return null;
    }
  }
}
