# Customer & Customer-Admin Pages Optimization Plan

## Overview

This document provides instructions for optimizing **customer** and **customer-admin** pages following the same patterns established during the admin pages optimization.

---

## What Was Done for Admin Pages (Reference)

### 1. Global Background
- **Gray background** (`#f4f4f5`) was set on the `html` element in `src/styles.scss`
- This ensures the gray background covers the entire viewport without needing `min-height: 100%` hacks on every page
- `.app__main` in `app.component.scss` also has the gray background as backup

### 2. Page Structure Standardization

**List Pages:**
```html
<main class="page-content">
  <ui-breadcrumbs [items]="breadcrumbs" separator="chevron" />
  <ui-list-header title="Page Title" ... />
  
  <div class="table-container">
    <ui-tabs ... />
    <ui-data-table ... />
    <ui-table-footer ... />
  </div>
</main>

<ui-mobile-footer>
  <!-- Mobile action buttons -->
</ui-mobile-footer>
```

**Detail Pages:**
```html
<div class="detail-page">
  <ui-breadcrumbs [items]="breadcrumbs" separator="chevron" />
  <ui-detail-header [title]="isEditMode ? 'Edit X' : 'Add X'" ... />
  
  <div class="detail-content">
    <div class="form-card">
      <h2 class="form-card__title">Section Title</h2>
      <div class="form-card__content">
        <ui-form-field label="Label" layout="horizontal">...</ui-form-field>
        <ui-toggle label="Toggle Label" ... />
      </div>
    </div>
  </div>
</div>

<ui-mobile-footer>
  <!-- Mobile action buttons -->
</ui-mobile-footer>
```

### 3. SCSS Mixin Usage

**List Page SCSS Pattern:**
```scss
@use '../../ui-kit/admin-shared' as admin;

:host {
  @include admin.admin-host;
}

.page-name {
  @include admin.admin-page;
}

.page-content {
  @include admin.list-page-content;
}

.table-container {
  @include admin.tabs-table-container;
}

@include admin.tabs-table-data-table;
```

**Detail Page SCSS Pattern:**
```scss
@use '../../ui-kit/admin-shared' as admin;

:host {
  @include admin.admin-host;
  min-height: 100%;
}

.detail-page {
  @include admin.detail-page;
}

.detail-content {
  @include admin.detail-page-content;
  
  @media (max-width: 768px) {
    padding-bottom: 80px; // Space for mobile footer
  }
}

.form-card {
  @include admin.form-card;
}

// CRITICAL: This mixin handles form field AND toggle label alignment
@include admin.detail-form-styles;

// For horizontal toggle rows (if needed)
.toggles-row {
  @include admin.toggles-row;
}
```

### 4. Label Width Standardization (133px)

**Form Fields:**
- `ui-form-field` component has default `labelWidth = '133px'` (set in `form-field.component.ts`)
- Applied as inline style `[style.width]` and `[style.min-width]` on the label

**Toggles:**
- The `detail-form-styles` mixin applies `display: grid` with `grid-template-columns: 133px auto` to toggles
- This aligns toggle labels with form field labels

**Important:** If you see `128px` anywhere, it's wrong - should be `133px`.

### 5. Toggle Row Behavior

**Desktop (horizontal row):**
- Toggles use natural `inline-flex` layout
- Labels can be any width (no constraint)

**Tablet/Mobile (vertical stack):**
- Toggles use `grid` layout with `133px` column for label
- This aligns with form fields below

The `toggles-row` mixin handles this automatically.

### 6. Mobile Footer

- Use `ui-mobile-footer` component
- It uses `position: fixed` to stick to bottom of viewport
- Add `padding-bottom: 80px` to page content on mobile to prevent overlap

### 7. Global UI Components to Use

| Component | Purpose |
|-----------|---------|
| `ui-breadcrumbs` | Navigation breadcrumbs (always use `separator="chevron"`) |
| `ui-list-header` | List page header with title, count, actions |
| `ui-detail-header` | Detail page header with back button, title, actions |
| `ui-data-table` | All tables (NEVER use custom HTML tables) |
| `ui-table-footer` | Pagination |
| `ui-form-field` | Form inputs (use `layout="horizontal"` for label alignment) |
| `ui-toggle` | Toggle switches |
| `ui-tabs` | Tab navigation |
| `ui-badge` | Status badges |
| `ui-mobile-footer` | Mobile action buttons |
| `ui-modal` | Confirmation dialogs |
| `app-text-editor` | Rich text editing |

### 8. Cleanup Rules

1. **If a pattern repeats more than once, create a mixin**
2. **Clean unused styles DURING iteration, not as separate phase**
3. **Search for duplicated code blocks** and consolidate
4. **Remove orphaned files/folders** that aren't in routes
5. **Check for inline styles** that should be in CSS
6. **Look for hardcoded values** that should use variables (e.g., `128px` → `133px`)

### 9. CSS Specificity Notes

- Component styles have Angular view encapsulation (`_ngcontent-ng-c...`)
- To override component styles from parent, use `::ng-deep`
- Inline styles (from component inputs like `labelWidth`) have highest specificity
- Use `!important` sparingly, only when necessary to override component styles

### 10. Key Files Modified During Admin Optimization

| File | Changes |
|------|---------|
| `src/styles.scss` | Added gray background on `html` |
| `src/app/app.component.scss` | Fixed height, added gray background to `.app__main` |
| `src/app/ui-kit/_admin-shared.scss` | Main mixin library (reduced from 1544 to 1113 lines) |
| `src/app/ui-kit/molecules/form-field/form-field.component.ts` | Changed default `labelWidth` to `133px` |
| All admin list pages | Applied `list-page-content`, `tabs-table-*` mixins |
| All admin detail pages | Applied `detail-page-content`, `detail-form-styles` mixins |

### 11. Unused Code Removed

- **25 unused mixins** removed from `_admin-shared.scss` (~430 lines)
- **Orphaned folders** deleted: `/features/dashboard`, `/features/products`
- **Orphaned route** removed: `/products` from `app.routes.ts`
- **Duplicated inline styles** replaced with mixin includes (e.g., `.pill` styles)

---

## Pages to Optimize

### Customer-Admin:
- `customer-admin/orders/` (list + detail)
- `customer-admin/users/`
- `customer-admin/company/`
- `customer-admin/machines/`
- `customer-admin/documentation/`
- `customer-admin/settings/`
- `customer-admin/support/`

### Customer:
- `customer/dashboard/`
- `customer/shop/` (list) ⚠️ **837 lines - highest priority**
- `customer/shop/cart/`
- `customer/shop/checkout/`
- `customer/shop/product-detail/`
- `customer/shop/product-groups/`
- `customer/shop/products-in-group/`
- `customer/shop/wishlist/`
- `customer/shop/wishlist-page/`
- `customer/shop/order-success/`
- `customer/inquiry/` (list + detail)

---

## Checklist Per Page

- [ ] HTML structure matches standard pattern (see Section 2)
- [ ] Uses correct global components (see Section 7)
- [ ] SCSS uses mixins instead of custom styles (see Section 3)
- [ ] Form fields use `layout="horizontal"` and 133px label width
- [ ] Toggles align with form fields via `detail-form-styles` mixin
- [ ] Mobile footer added with proper padding
- [ ] Breadcrumbs use `separator="chevron"`
- [ ] Tables use `ui-data-table`, not custom HTML
- [ ] Unused styles removed
- [ ] No duplicated code that should be a mixin
