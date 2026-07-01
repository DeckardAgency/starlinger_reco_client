# RECO Client App — Improvement Plan (target: ≥ 9/10)

**Current: 6/10** (Angular 20.3, standalone + SSR, ~customer-facing shop/orders)
Strong bones (fully standalone, 100% lazy, real `BaseHttpService`, correct JWT-refresh
interceptor, auth-layer tests). Held back by mid-migration inconsistency, a mock module
wired into production, fat components, leftover logging, and tests that stop at the core.

> Definition of 9/10: one consistent HTTP/state convention, no mock code on production
> paths, no debug logging, `as any` only where unavoidable, feature + e2e tests covering the
> money paths (cart→checkout→order), idiomatic SSR guards.

---

## P0 — Production hygiene (quick, high-signal)

### 0.1 Quarantine the 83 KB mock module
`core/mocks/mock-data.ts` (83 KB) is a **production type source**: `ShopProduct` lives there
and is imported by 8 prod files (`cart.service.ts:2`, `shop.component.ts:18`, `checkout`,
`product-detail`, `customer-dashboard`, …). `MockInterceptor` (15 KB) + `useMocks` ride along
in the bundle.

**Fix:**
- Promote `ShopProduct` (and any real shared types) to `core/models/product.model.ts`.
- Move mocks + `MockInterceptor` behind a dev-only path (separate entry or
  `fileReplacements` in `angular.json` so they're tree-shaken from prod).
- Remove `DUMMY_USER`/`DUMMY_TOKEN`/dummy-credential imports from `auth.service.ts:10,16-21`;
  gate dummy auth behind a dev build only.

**Acceptance:** prod bundle contains no `mock-data`/`MockInterceptor`; `ShopProduct` imported
from `@core/models`; `grep -rn "mocks/mock-data" src` returns only dev-scoped files.

### 0.2 Remove debug logging
31 `console.log` calls, several on prod paths — `app.config.ts:21`,
`order.service.ts:76,92,121,146` (`'Raw API response:'`).
**Fix:** delete them; if telemetry is wanted, route through a `LoggerService` that no-ops in
prod. Add an ESLint rule `no-console` (allow `warn`/`error`) to prevent regressions.

### 0.3 Replace native `alert()`
`auth.guard.ts:59`, `app.component.ts:148` use `alert()` for real user messaging.
**Fix:** use the existing toast/notification component.

---

## P1 — HTTP & state consistency

### 1.1 Route all services through `BaseHttpService`
8 services bypass it and hand-roll `HttpClient` + headers: `order.service.ts`,
`client.service.ts`, `dashboard.service.ts`, `documentation.service.ts`,
`support-ticket.service.ts`, `media.service.ts`, `address.service.ts`,
`delivery-cost.service.ts`. `OrderService` hardcodes `${apiBaseUrl}/api/v1/orders`
(`order.service.ts:13`) instead of `apiPath`.

**Fix:** extend `BaseHttpService` everywhere; use `buildUrl`/`buildArrayParams`. Collapse the
duplicated ~40-line param builders in `OrderService.getOrders` vs `exportOrdersToExcel`
(`:36-73` vs `:163-200`) into one `buildArrayParams` call.

**Acceptance:** every `*.service.ts` extends `BaseHttpService`; no hardcoded `/api/v1` literals;
no duplicated param-building blocks.

### 1.2 One state convention
`AuthService` uses `BehaviorSubject` (`auth.service.ts:33-37`) while cart/wishlist use signals.
Pick **signals** as the default for component-facing state; keep Subjects only where stream
semantics are needed (interceptor refresh). Document the convention in the repo README.

---

## P2 — Type safety

- 47 `: any`/`as any`. Remove the noise casts first: `(environment as any).useMocks`
  (`auth.service.ts:54,58,313`) — the field **is** typed; just type `environment`.
- `documents as any[]).map((doc: any) =>` (`shop.component.ts:246`) — type the documents shape.
- Audit remaining `any` at HTTP boundaries; introduce response models where missing.
- Add ESLint `@typescript-eslint/no-explicit-any` (warn, ratchet to error).

**Acceptance:** `as any` count down to single digits, each with a justifying comment.

---

## P3 — Component size & structure

Fat components mixing data + UI + routing:
`orders.component.ts` (495), `shop.component.ts` (471), `products-in-group` (432),
`users.component.ts` (423).

**Fix (start with `ShopComponent`):** extract data-loading/mapping into a feature service or
`*-facade`; move filtering/infinite-scroll into focused child components or a directive; keep
the component as a thin view. Target < ~250 lines per component.

---

## P4 — Error handling & SSR

### 4.1 Surface HTTP failures
`OrderService` catches and silently returns empty + `console.error` (`order.service.ts:95-106`)
— failures are invisible to the user. Add a global **HTTP error interceptor** that maps
errors to toasts (and a global `ErrorHandler`), so feature code stops swallowing.

### 4.2 Idiomatic SSR guards
`localStorage` (63 hits) is guarded by try/catch, but only **one** file uses
`isPlatformBrowser`/`PLATFORM_ID` (`agent-client-selection.service.ts`). Wrap browser-only APIs
(localStorage, window) behind a small `BrowserStorageService` that checks `PLATFORM_ID`, and
use it everywhere (`auth.service.ts:357-386`, `cart.service.ts:135-148`, …).

**Acceptance:** no direct `localStorage`/`window` in services; SSR build renders without
browser-API errors.

---

## P5 — Testing

Today: 6 substantive specs, all core (auth service/interceptor/guard, `BaseHttpService`, a
pipe). Playwright e2e exists but thin.

1. **Unit** the money path: `cart.service`, `wishlist.service`, `checkout.component` (incl.
   the on-behalf-of `onBehalfOfClient` payload), `order.service`.
2. **Component** tests for `shop`, `orders`, `my-clients` (agent selection persistence + role
   gating).
3. **e2e** (Playwright): login → add to cart → checkout → order success; agent flow
   (select managed client → checkout sends on-behalf-of); keep axe-core a11y checks.
4. Target **≥60%** statements overall, **≥80%** on `core/services` + checkout/cart.

**Acceptance:** `ng test` + `playwright test` green in CI; coverage gates met.

---

## P6 — CI / tooling

- CI: `ng lint` (with the new `no-console`/`no-explicit-any` rules), `ng build` (prod),
  `ng test --watch=false --code-coverage`, `playwright test`.
- Add a **bundle-size budget** in `angular.json` and assert mocks are excluded from prod.
- Pin/raise Node: builds need **Node ≥ 20.19** (current default here is 20.10; use Node 22).

---

## Done-when checklist
- [ ] mocks + dummy auth excluded from prod bundle; `ShopProduct` in `@core/models`
- [ ] 0 `console.log` on prod paths; `no-console` lint rule
- [ ] all services extend `BaseHttpService`; no hardcoded `/api/v1`; no duplicated param builders
- [ ] `as any` single digits; `environment` typed
- [ ] global HTTP-error interceptor + toasts; no silent empty-returns
- [ ] SSR-safe storage wrapper; no raw `localStorage` in services
- [ ] fat components split (< ~250 lines)
- [ ] unit+component+e2e coverage on cart→checkout→order; CI gates green
