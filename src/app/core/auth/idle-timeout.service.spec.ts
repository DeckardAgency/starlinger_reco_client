import { TestBed, fakeAsync, tick, discardPeriodicTasks } from '@angular/core/testing';
import { Router } from '@angular/router';
import { BehaviorSubject, Subject } from 'rxjs';
import { AuthService } from './auth.service';
import {
  DEFAULT_IDLE_TIMEOUT_MS,
  IDLE_ACTIVITY_STORAGE_KEY,
  IDLE_TIMEOUT_MS,
  IdleTimeoutService
} from './idle-timeout.service';

describe('IdleTimeoutService', () => {
  const MINUTE = 60 * 1000;
  const TIMEOUT = 30 * MINUTE;

  let isAuthenticated$: BehaviorSubject<boolean>;
  let logoutSpy: jasmine.Spy;
  let navigateSpy: jasmine.Spy;

  /** Build the service the way the app does: it starts itself from the auth state. */
  function setup(authenticated: boolean): void {
    TestBed.resetTestingModule();
    isAuthenticated$ = new BehaviorSubject<boolean>(authenticated);
    logoutSpy = jasmine.createSpy('logout').and.callFake(() => isAuthenticated$.next(false));
    navigateSpy = jasmine.createSpy('navigate').and.resolveTo(true);

    TestBed.configureTestingModule({
      providers: [
        IdleTimeoutService,
        { provide: IDLE_TIMEOUT_MS, useValue: TIMEOUT },
        { provide: AuthService, useValue: { isAuthenticated$, logout: logoutSpy } },
        { provide: Router, useValue: { events: new Subject<unknown>(), navigate: navigateSpy } }
      ]
    });
    TestBed.inject(IdleTimeoutService);
  }

  beforeEach(() => localStorage.removeItem(IDLE_ACTIVITY_STORAGE_KEY));
  afterEach(() => {
    TestBed.resetTestingModule(); // detaches the listeners/timer of the service under test
    localStorage.removeItem(IDLE_ACTIVITY_STORAGE_KEY);
  });

  it('defaults to 30 minutes', () => {
    expect(DEFAULT_IDLE_TIMEOUT_MS).toBe(30 * MINUTE);
  });

  it('logs out and goes to /login after the timeout without activity', fakeAsync(() => {
    setup(true);

    tick(TIMEOUT - MINUTE);
    expect(logoutSpy).not.toHaveBeenCalled();

    tick(2 * MINUTE);
    expect(logoutSpy).toHaveBeenCalledTimes(1);
    expect(navigateSpy).toHaveBeenCalledWith(['/login']);
    expect(localStorage.getItem(IDLE_ACTIVITY_STORAGE_KEY)).toBeNull();
    discardPeriodicTasks();
  }));

  it('user activity postpones the logout', fakeAsync(() => {
    setup(true);

    tick(20 * MINUTE);
    document.dispatchEvent(new Event('keydown'));

    tick(20 * MINUTE); // 40 min after start, 20 min after the key press
    expect(logoutSpy).not.toHaveBeenCalled();

    tick(11 * MINUTE); // 31 min after the key press
    expect(logoutSpy).toHaveBeenCalledTimes(1);
    discardPeriodicTasks();
  }));

  it('activity in another tab (shared timestamp) keeps this tab signed in', fakeAsync(() => {
    setup(true);

    tick(20 * MINUTE);
    localStorage.setItem(IDLE_ACTIVITY_STORAGE_KEY, String(Date.now()));

    tick(20 * MINUTE);
    expect(logoutSpy).not.toHaveBeenCalled();

    tick(11 * MINUTE);
    expect(logoutSpy).toHaveBeenCalledTimes(1);
    discardPeriodicTasks();
  }));

  it('signs out when another tab ends the session (timestamp removed)', fakeAsync(() => {
    setup(true);

    window.dispatchEvent(new StorageEvent('storage', { key: IDLE_ACTIVITY_STORAGE_KEY, newValue: null }));

    expect(logoutSpy).toHaveBeenCalledTimes(1);
    discardPeriodicTasks();
  }));

  it('signs out immediately when the session was already idle for too long (reload)', fakeAsync(() => {
    localStorage.setItem(IDLE_ACTIVITY_STORAGE_KEY, String(Date.now() - TIMEOUT - MINUTE));

    setup(true);

    expect(logoutSpy).toHaveBeenCalledTimes(1);
    discardPeriodicTasks();
  }));

  it('does nothing while signed out, and a fresh login starts a fresh countdown', fakeAsync(() => {
    // Stale timestamp from an earlier session must not hit the next login.
    localStorage.setItem(IDLE_ACTIVITY_STORAGE_KEY, String(Date.now() - 2 * TIMEOUT));
    setup(false);

    tick(2 * TIMEOUT);
    expect(logoutSpy).not.toHaveBeenCalled();
    expect(localStorage.getItem(IDLE_ACTIVITY_STORAGE_KEY)).toBeNull();

    isAuthenticated$.next(true);
    expect(logoutSpy).not.toHaveBeenCalled();
    expect(localStorage.getItem(IDLE_ACTIVITY_STORAGE_KEY)).not.toBeNull();

    tick(TIMEOUT + MINUTE);
    expect(logoutSpy).toHaveBeenCalledTimes(1);
    discardPeriodicTasks();
  }));
});
