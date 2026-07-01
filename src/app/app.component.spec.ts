/**
 * NOTE: The original AppComponent spec here was a verbatim copy from the InqTool
 * project. It imported services that do not exist in reco
 * (`@services/cart/quick-cart.service`, `@services/cart/manual-quick-cart.service`,
 * `@services/login-modal.service`) and asserted on AppComponent methods reco's
 * component never had (`onViewManualCart`, `onViewCart`, `isManualEntryRoute`).
 * It therefore never compiled in this project and broke the whole Karma suite.
 *
 * Replaced with this placeholder so the test suite compiles and runs. A proper
 * AppComponent spec should be written against reco's actual component API.
 */
describe('AppComponent', () => {
  it('has a placeholder spec pending a reco-specific rewrite', () => {
    expect(true).toBeTrue();
  });
});
