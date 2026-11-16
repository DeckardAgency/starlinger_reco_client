import { PLATFORM_ID } from '@angular/core';
import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Router, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree } from '@angular/router';
import { Observable, Subject, of } from 'rxjs';
import { AuthGuard } from './auth.guard';
import { AuthService } from './auth.service';
import { AlertService } from '@core/services/alert.service';
import { LoginModalService } from '@services/login-modal.service';
import { LoggerService } from '@services/logger.service';

describe('AuthGuard', () => {
  let guard: AuthGuard;
  let authService: jasmine.SpyObj<AuthService>;
  let router: jasmine.SpyObj<Router>;
  let loginModalService: jasmine.SpyObj<LoginModalService>;
  let alertService: jasmine.SpyObj<AlertService>;

  const route = {} as ActivatedRouteSnapshot;
  const stateFor = (url: string) => ({ url }) as RouterStateSnapshot;
  const loginUrlTree = { toString: () => '/login' } as UrlTree;

  function setup(platformId: 'browser' | 'server' = 'browser'): void {
    const authServiceSpy = jasmine.createSpyObj('AuthService', [
      'isAuthenticated',
      'checkSession',
      'isClientArchived',
      'hasClient',
      'hasRole',
      'logout'
    ]);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate', 'createUrlTree']);
    const loginModalServiceSpy = jasmine.createSpyObj('LoginModalService', ['open', 'setReturnUrl']);
    const alertServiceSpy = jasmine.createSpyObj('AlertService', ['warning']);
    const loggerServiceSpy = jasmine.createSpyObj('LoggerService', ['createLogger']);

    loggerServiceSpy.createLogger.and.returnValue({
      debug: jasmine.createSpy('debug'),
      info: jasmine.createSpy('info'),
      warn: jasmine.createSpy('warn'),
      error: jasmine.createSpy('error')
    });
    routerSpy.createUrlTree.and.returnValue(loginUrlTree);

    // Defaults: an ordinary customer with a client assignment and no special roles.
    authServiceSpy.isClientArchived.and.returnValue(false);
    authServiceSpy.hasClient.and.returnValue(true);
    authServiceSpy.hasRole.and.returnValue(false);

    TestBed.configureTestingModule({
      providers: [
        AuthGuard,
        { provide: PLATFORM_ID, useValue: platformId },
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy },
        { provide: LoginModalService, useValue: loginModalServiceSpy },
        { provide: AlertService, useValue: alertServiceSpy },
        { provide: LoggerService, useValue: loggerServiceSpy }
      ]
    });

    guard = TestBed.inject(AuthGuard);
    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    loginModalService = TestBed.inject(LoginModalService) as jasmine.SpyObj<LoginModalService>;
    alertService = TestBed.inject(AlertService) as jasmine.SpyObj<AlertService>;
  }

  /** Subscribes to an async guard result and returns what it emitted (undefined = nothing yet). */
  function emitted(result: unknown): { value: boolean | UrlTree | undefined } {
    const seen: { value: boolean | UrlTree | undefined } = { value: undefined };
    (result as Observable<boolean | UrlTree>).subscribe(value => (seen.value = value));
    return seen;
  }

  describe('authenticated (cached auth state)', () => {
    beforeEach(() => {
      setup();
      authService.isAuthenticated.and.returnValue(true);
    });

    it('should be created', () => {
      expect(guard).toBeTruthy();
    });

    it('allows activation synchronously, without a session check', () => {
      const result = guard.canActivate(route, stateFor('/customer/orders'));

      expect(result).toBe(true);
      expect(authService.checkSession).not.toHaveBeenCalled();
      expect(router.navigate).not.toHaveBeenCalled();
      expect(authService.logout).not.toHaveBeenCalled();
    });

    it('logs out, navigates home and opens the login modal when the client is archived', fakeAsync(() => {
      authService.isClientArchived.and.returnValue(true);

      const result = guard.canActivate(route, stateFor('/customer/orders'));

      expect(result).toBe(false);
      expect(authService.logout).toHaveBeenCalled();
      expect(router.navigate).toHaveBeenCalledWith(['/']);

      expect(loginModalService.open).not.toHaveBeenCalled();
      tick(100);
      expect(loginModalService.open).toHaveBeenCalled();
    }));

    it('redirects a user without a client to /no-client on customer routes', () => {
      authService.hasClient.and.returnValue(false);

      const result = guard.canActivate(route, stateFor('/customer/orders'));

      expect(result).toBe(false);
      expect(router.navigate).toHaveBeenCalledWith(['/no-client']);
      expect(authService.logout).not.toHaveBeenCalled();
    });

    it('does not require a client assignment outside /customer', () => {
      authService.hasClient.and.returnValue(false);

      expect(guard.canActivate(route, stateFor('/profile'))).toBe(true);
      expect(router.navigate).not.toHaveBeenCalled();
    });

    it('logs a finance-only user out of customer routes and explains why', fakeAsync(() => {
      authService.hasRole.and.callFake((role: string) => role === 'ROLE_FINANCE');

      const result = guard.canActivate(route, stateFor('/customer/orders'));

      expect(result).toBe(false);
      expect(authService.logout).toHaveBeenCalled();
      expect(router.navigate).toHaveBeenCalledWith(['/']);

      tick(200);
      expect(loginModalService.open).toHaveBeenCalled();
      expect(alertService.warning).toHaveBeenCalled();
    }));

    it('lets a finance user who also has a shop role through', () => {
      authService.hasRole.and.callFake((role: string) => role === 'ROLE_FINANCE' || role === 'ROLE_CLIENT');

      expect(guard.canActivate(route, stateFor('/customer/orders'))).toBe(true);
      expect(authService.logout).not.toHaveBeenCalled();
    });
  });

  describe('auth state unknown in the browser (page refresh)', () => {
    beforeEach(() => setup());

    it('waits for the session check instead of deciding immediately', () => {
      const session$ = new Subject<null>();
      authService.isAuthenticated.and.returnValue(false);
      authService.checkSession.and.returnValue(session$);

      const seen = emitted(guard.canActivate(route, stateFor('/customer/checkout')));

      expect(authService.checkSession).toHaveBeenCalled();
      expect(seen.value).toBeUndefined();
      expect(router.createUrlTree).not.toHaveBeenCalled();
      expect(loginModalService.setReturnUrl).not.toHaveBeenCalled();
    });

    it('allows activation once the session check finds a signed-in user', () => {
      // false on entry (state unknown), true after checkSession() restored the user.
      authService.isAuthenticated.and.returnValues(false, true);
      authService.checkSession.and.returnValue(of(null));

      const seen = emitted(guard.canActivate(route, stateFor('/customer/checkout')));

      expect(seen.value).toBe(true);
      expect(router.createUrlTree).not.toHaveBeenCalled();
      expect(loginModalService.setReturnUrl).not.toHaveBeenCalled();
    });

    it('applies the access checks after the session check (archived client)', fakeAsync(() => {
      authService.isAuthenticated.and.returnValues(false, true);
      authService.checkSession.and.returnValue(of(null));
      authService.isClientArchived.and.returnValue(true);

      const seen = emitted(guard.canActivate(route, stateFor('/customer/checkout')));

      expect(seen.value).toBe(false);
      expect(authService.logout).toHaveBeenCalled();
      expect(router.navigate).toHaveBeenCalledWith(['/']);
      tick(100);
      expect(loginModalService.open).toHaveBeenCalled();
    }));

    it('redirects to /login, remembers the URL and opens the login modal when there is no session', fakeAsync(() => {
      authService.isAuthenticated.and.returnValue(false);
      authService.checkSession.and.returnValue(of(null));

      const seen = emitted(guard.canActivate(route, stateFor('/customer/checkout')));

      expect(router.createUrlTree).toHaveBeenCalledWith(['/login']);
      expect(seen.value).toBe(loginUrlTree);
      expect(loginModalService.setReturnUrl).toHaveBeenCalledWith('/customer/checkout');

      expect(loginModalService.open).not.toHaveBeenCalled();
      tick(100);
      expect(loginModalService.open).toHaveBeenCalled();
    }));

    it('does not open the login modal if the user became authenticated in the meantime', fakeAsync(() => {
      // entry: false, after the session check: false, inside the 100 ms timer: true
      authService.isAuthenticated.and.returnValues(false, false, true);
      authService.checkSession.and.returnValue(of(null));

      const seen = emitted(guard.canActivate(route, stateFor('/customer/checkout')));

      expect(seen.value).toBe(loginUrlTree);
      tick(100);
      expect(loginModalService.open).not.toHaveBeenCalled();
    }));
  });

  describe('on the server (SSR)', () => {
    beforeEach(() => setup('server'));

    it('blocks without redirecting or probing the session', () => {
      authService.isAuthenticated.and.returnValue(false);

      const result = guard.canActivate(route, stateFor('/customer/checkout'));

      expect(result).toBe(false);
      expect(authService.checkSession).not.toHaveBeenCalled();
      expect(router.createUrlTree).not.toHaveBeenCalled();
      expect(router.navigate).not.toHaveBeenCalled();
      expect(loginModalService.open).not.toHaveBeenCalled();
    });
  });
});
