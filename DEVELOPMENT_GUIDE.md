# Starlinger Reco Client - Development Guide

## Project Overview

This Angular application is a frontend client for the Starlinger Reco system. The project was initialized by migrating reusable components from `starlinger_inquiry_tool_admin_client` and implementing new features based on Figma designs.

### Tech Stack
- **Framework**: Angular 17+ (Standalone Components)
- **Styling**: SCSS with component scoping
- **State Management**: Angular Signals
- **Change Detection**: OnPush strategy
- **Routing**: Angular Router with lazy loading
- **Mock Data**: HTTP Interceptor pattern for local development

---

## Project Structure

```
src/app/
├── core/
│   ├── guards/           # Auth and Role guards
│   ├── interceptors/     # HTTP interceptors
│   ├── mocks/            # Mock data and interceptor
│   │   ├── mock-data.ts  # All mock data definitions
│   │   └── mock.interceptor.ts  # Intercepts HTTP and returns mock data
│   ├── models/           # TypeScript interfaces
│   └── services/         # Business logic services
├── features/
│   └── admin/            # Admin feature modules
│       ├── accounts/
│       ├── contacts/
│       ├── countries/        # ✅ Implemented (Super Admin)
│       ├── dashboard/
│       ├── delivery-prices/  # ✅ Implemented (Super Admin)
│       ├── delivery-types/   # ✅ Implemented (Super Admin)
│       ├── discounts/        # ✅ Implemented
│       ├── fuel-surcharges/  # ✅ Implemented (Super Admin)
│       ├── manual-entries/
│       ├── packaging-prices/ # ✅ Implemented (Super Admin)
│       ├── payment-types/    # ✅ Implemented (Super Admin)
│       ├── products/         # ✅ Implemented
│       ├── shop-orders/
│       ├── tax-types/        # ✅ Implemented (Super Admin)
│       ├── users/            # ✅ Implemented (Super Admin)
│       └── warehouses/       # ✅ Implemented (Super Admin)
├── layout/
│   ├── main-layout/
│   ├── navbar/
│   └── sidebar/
├── shared/               # Shared utilities and pipes
└── ui-kit/               # Reusable UI components
    ├── atoms/            # Basic building blocks
    ├── molecules/        # Composite components
    └── organisms/        # Complex components
```

---

## UI Kit Components (Reuse These!)

### Atoms (Basic Building Blocks)
| Component | Path | Usage |
|-----------|------|-------|
| `ui-avatar` | `atoms/avatar/` | User avatars with image or initials |
| `ui-badge` | `atoms/badge/` | Status badges, tags, pills (`success`, `danger`, `warning`, `info`, `dark`) |
| `ui-button` | `atoms/button/` | Buttons with variants |
| `ui-checkbox` | `atoms/checkbox/` | Checkboxes |
| `ui-input` | `atoms/input/` | Text inputs |
| `ui-select` | `atoms/select/` | Dropdown selects |
| `ui-toggle` | `atoms/toggle/` | Toggle switches (supports `labelPosition="left"`) |
| `ui-textarea` | `atoms/textarea/` | Multiline text input |
| `ui-spinner` | `atoms/spinner/` | Loading spinner |
| `ui-shimmer` | `atoms/shimmer/` | Loading skeleton |

### Molecules (Composite Components)
| Component | Path | Usage |
|-----------|------|-------|
| `ui-breadcrumbs` | `molecules/breadcrumbs/` | Navigation breadcrumbs |
| `ui-card` | `molecules/card/` | Content cards |
| `ui-form-field` | `molecules/form-field/` | Label + input wrapper (supports `layout="horizontal"`) |
| `ui-pagination` | `molecules/pagination/` | Table pagination (`totalItems`, `itemsPerPage`, `currentPage`) |
| `ui-tabs` | `molecules/tabs/` | Tab navigation (`variant="underline"` for detail pages) |
| `ui-dropdown-menu` | `molecules/dropdown-menu/` | Context menus |
| `ui-search` | `molecules/search/` | Search input with suggestions |
| `ui-accordion` | `molecules/accordion/` | Collapsible sections |
| `ui-order-card` | `molecules/order-card/` | Order/inquiry display cards |

### Organisms (Complex Components)
| Component | Path | Usage |
|-----------|------|-------|
| `ui-data-table` | `organisms/data-table/` | Data tables with sorting, templates |
| `ui-card-grid` | `organisms/card-grid/` | Grid layout for cards |
| `ui-modal` | `organisms/modal/` | Modal dialogs |
| `ui-drawer` | `organisms/drawer/` | Side drawers |

---

## How to Import Components

```typescript
// In your component.ts
import { BadgeComponent } from '@app/ui-kit/atoms/badge/badge.component';
import { DataTableComponent, TableColumn, SortEvent } from '@app/ui-kit/organisms/data-table/data-table.component';
import { FormFieldComponent } from '@app/ui-kit/molecules/form-field/form-field.component';
import { PaginationComponent } from '@app/ui-kit/molecules/pagination/pagination.component';
import { TabsComponent, TabItem } from '@app/ui-kit/molecules/tabs/tabs.component';
import { ToggleComponent } from '@app/ui-kit/atoms/toggle/toggle.component';
import { ModalComponent } from '@app/ui-kit/organisms/modal/modal.component';

@Component({
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    BadgeComponent,
    DataTableComponent,
    FormFieldComponent,
    PaginationComponent,
    TabsComponent,
    ToggleComponent,
    ModalComponent,
    // ... other components
  ],
})
```

---

## Implemented Pages

### 1. Dashboard
- **Route**: `/admin/dashboard`
- **Components**: `DashboardComponent`, `PerformanceOverviewComponent`, `ActiveOrdersComponent`
- **Features**: Performance cards, date picker, order/inquiry cards

### 2. Accounts
- **List Route**: `/admin/accounts`
- **Detail Route**: `/admin/accounts/:id` or `/admin/accounts/new`
- **Features**: Data table, search, pagination, tabs for contacts/addresses/orders

### 3. Contacts
- **List Route**: `/admin/contacts`
- **Detail Route**: `/admin/contacts/:id` or `/admin/contacts/new`
- **Features**: Data table, add/edit form

### 4. Shop Orders
- **List Route**: `/admin/shop-orders`
- **Detail Route**: `/admin/shop-orders/:id`
- **Features**: Tabbed list (Latest/Completed/Cancelled), order details with collapsible product groups

### 5. Manual Entries
- **List Route**: `/admin/manual-entries`
- **Detail Route**: `/admin/manual-entries/:id`
- **Features**: Similar to shop orders, inquiry overview with attached files

### 6. Products ✅
- **List Route**: `/admin/products`
- **Detail Route**: `/admin/products/:id` or `/admin/products/new`
- **Features**:
  - Row selection with 3-dots header dropdown (Select all / None)
  - Bulk actions (delete selected)
  - Data table with sorting
  - Product detail page with:
    - Basic details card with toggles (Active, Ready for Shop)
    - Prices card
    - Tabbed section (Short description, Gallery, Product documents, Applied discounts)
    - Rich text editor with toolbar
    - Image gallery with dropdown actions (Make primary, Rename, Download, Delete)
    - Documents table with actions
    - Applied discounts table
    - Select related products table with pagination
    - Related products table
    - Rename modal for images/documents

### 7. Discounts ✅
- **List Route**: `/admin/discounts`
- **Detail Routes**: `/admin/discounts/new` or `/admin/discounts/:id`
- **Features**:
  - Data table with checkbox selection
  - Status badges (Active/Inactive)
  - Discount detail page with:
    - Active toggle
    - Form fields: Name, Date from, Date to, Discount %, Priority
    - Multi-select fields with pills: Account groups, Accounts
    - Products that match criteria table (edit mode only)
    - Pagination

---

## Super Admin Pages (Implemented)

All super admin pages follow consistent patterns for list/detail views.

### 8. Countries ✅
- **List Route**: `/admin/countries`
- **Detail Route**: `/admin/countries/:id` or `/admin/countries/new`
- **Model**: `Country` with id, name, taxRate, dhlZone, isEu, isActive
- **Features**:
  - Data table with DHL Zone, Tax Rate, EU flag, Status
  - Select-with-pill pattern for DHL Zone dropdown
  - Active toggle

### 9. Tax Types ✅
- **List Route**: `/admin/tax-types`
- **Detail Route**: `/admin/tax-types/:id` or `/admin/tax-types/new`
- **Model**: `TaxType` with id, name, description, isActive
- **Features**:
  - Simple list/detail with name and description
  - Active toggle

### 10. Payment Types ✅
- **List Route**: `/admin/payment-types`
- **Detail Route**: `/admin/payment-types/:id` or `/admin/payment-types/new`
- **Model**: `PaymentType` with id, name, shortDescription, isActive, documents[]
- **Features**:
  - Tabbed detail page (Short description, Documents)
  - Rich text editor in Short description tab
  - Documents table with 3-dots dropdown (Rename, Download, Delete)
  - Rename modal for documents
  - Active toggle

### 11. Delivery Types ✅
- **List Route**: `/admin/delivery-types`
- **Detail Route**: `/admin/delivery-types/:id` or `/admin/delivery-types/new`
- **Model**: `DeliveryType` with same structure as PaymentType
- **Features**: Same as Payment Types (tabs, documents, rename modal)

### 12. Warehouses ✅
- **List Route**: `/admin/warehouses`
- **Detail Route**: `/admin/warehouses/:id` or `/admin/warehouses/new`
- **Model**: `Warehouse` with id, name, address, isActive
- **Features**:
  - Simple list/detail with name and address
  - Active toggle

### 13. Delivery Prices ✅
- **List Route**: `/admin/delivery-prices`
- **Detail Route**: `/admin/delivery-prices/:id` or `/admin/delivery-prices/new`
- **Model**: `DeliveryPrice` with id, deliveryType, dhlZone, weightFrom, weightTo, price, isActive
- **Features**:
  - Select-with-pill pattern for DHL Zone and Delivery Type dropdowns
  - Weight range fields (From/To)
  - Price field
  - Active toggle

### 14. Fuel Surcharges ✅
- **List Route**: `/admin/fuel-surcharges`
- **Detail Route**: `/admin/fuel-surcharges/:id` or `/admin/fuel-surcharges/new`
- **Model**: `FuelSurcharge` with id, name, percentage, validFrom, validTo, isActive
- **Features**:
  - Percentage field
  - Date range fields (Valid from/Valid to)
  - Status badge (Active/Inactive)
  - Active toggle

### 15. Packaging Prices ✅
- **List Route**: `/admin/packaging-prices`
- **Detail Route**: `/admin/packaging-prices/:id` or `/admin/packaging-prices/new`
- **Model**: `PackagingPrice` with id, name, price, description, isActive
- **Features**:
  - Price field
  - Description textarea
  - Active toggle

### 16. Admin Users ✅
- **List Route**: `/admin/users`
- **Detail Route**: `/admin/users/:id` or `/admin/users/new`
- **Model**: `AdminUser` with id, firstName, lastName, username, email, role (single)
- **Features**:
  - User info fields (First name, Last name, Username, Email)
  - Password fields with show/hide toggle
  - Single role selection (Admin, Editor, Viewer, Profis) - NOT multi-select
  - Role displayed as clickable cards with checkbox indicator
  - Selected role: dark background (#18181b), white text, white checkbox

---

## Development Patterns

### 1. Mock Data System

All HTTP calls are intercepted in development mode:

```typescript
// mock.interceptor.ts
if (request.url.includes('/api/v1/products')) {
  return of(new HttpResponse({
    status: 200,
    body: mockProducts
  })).pipe(delay(300));
}
```

Add new mock data in `mock-data.ts`:
```typescript
export const mockNewEntity = {
  // your mock data
};
```

### 2. List Page Structure

Every list page follows this structure:

```html
<div class="page-name-page" (click)="closeDropdown()">
  <!-- Header with breadcrumbs -->
  <div class="page-header">
    <div class="page-header__breadcrumb">
      <a routerLink="/admin/dashboard" class="page-header__home"><!-- Home icon --></a>
      <span class="page-header__separator"><!-- Chevron --></span>
      <span class="page-header__current">Page Name</span>
    </div>
  </div>

  <!-- List header with icon, title, search, actions -->
  <div class="list-header">
    <div class="list-header__left">
      <svg class="list-header__icon"><!-- Icon --></svg>
      <h1 class="list-header__title">Title</h1>
      <span class="list-header__count">{{ totalCount() }}</span>
    </div>
    <div class="list-header__right">
      <div class="search-input"><!-- Search --></div>
      <button class="btn btn--primary">Add item</button>
    </div>
  </div>

  <!-- Table container -->
  <div class="table-container">
    <div class="table-wrapper">
      <ui-data-table [data]="items()" [columns]="columns" />
    </div>
  </div>

  <!-- Footer with pagination -->
  <div class="table-footer">
    <span class="table-footer__info">Showing X to Y from Z results</span>
    <ui-pagination [totalItems]="totalItems()" [itemsPerPage]="itemsPerPage()" />
  </div>
</div>

<!-- Templates for custom columns -->
<ng-template #checkboxHeaderTemplate>...</ng-template>
<ng-template #checkboxTemplate let-row>...</ng-template>
<ng-template #actionsTemplate let-row>...</ng-template>
```

### 3. Detail Page Structure

```html
<div class="detail-page">
  <!-- Breadcrumb header -->
  <div class="page-header">
    <div class="page-header__breadcrumb">
      <a routerLink="/admin/dashboard" class="page-header__home"><!-- Home icon --></a>
      <span class="page-header__separator"><!-- Chevron --></span>
      <a routerLink="/admin/list" class="page-header__link">List</a>
      <span class="page-header__separator"><!-- Chevron --></span>
      <span class="page-header__current">{{ isEditMode() ? item().name : 'Add new' }}</span>
    </div>
  </div>

  <div class="page-content">
    <!-- Section header with back button, title, actions -->
    <div class="section-header">
      <div class="section-header__left">
        <button class="btn btn--icon btn--outline" (click)="goBack()"><!-- Arrow left --></button>
        <h1 class="section-header__title">{{ isEditMode() ? item().name : 'Add new item' }}</h1>
      </div>
      <div class="section-header__actions">
        <button class="btn btn--outline">Save and continue</button>
        <button class="btn btn--primary">Save</button>
      </div>
    </div>

    <!-- Form cards -->
    <div class="form-card">
      <div class="card">
        <div class="card__toggles">
          <ui-toggle label="Active" labelPosition="left" />
        </div>
        <div class="card__fields">
          <ui-form-field label="Name" layout="horizontal">
            <input type="text" />
          </ui-form-field>
        </div>
      </div>
    </div>
  </div>
</div>
```

### 4. Data Table with Custom Templates

```typescript
// Component
@ViewChild('statusTemplate') statusTemplate!: TemplateRef<any>;
@ViewChild('checkboxHeaderTemplate') checkboxHeaderTemplate!: TemplateRef<any>;
@ViewChild('checkboxTemplate') checkboxTemplate!: TemplateRef<any>;
@ViewChild('actionsTemplate') actionsTemplate!: TemplateRef<any>;

columns: TableColumn[] = [];

ngAfterViewInit() {
  this.columns = [
    { key: 'checkbox', label: '', sortable: false, width: '56px', 
      template: this.checkboxTemplate, headerTemplate: this.checkboxHeaderTemplate },
    { key: 'name', label: 'Name', sortable: true },
    { key: 'status', label: 'Status', template: this.statusTemplate, width: '96px' },
    { key: 'actions', label: '', sortable: false, width: '64px', template: this.actionsTemplate }
  ];
  this.cdr.detectChanges(); // Required with OnPush
}
```

### 5. Select Field with Pills (Multi-select)

```html
<ui-form-field label="Accounts" layout="horizontal">
  <div class="select-with-pill">
    <span class="select-placeholder" *ngIf="items().length === 0">Select</span>
    <div class="pill" *ngFor="let item of items()">
      <button class="pill__remove" (click)="removeItem(item); $event.stopPropagation()">
        <svg><!-- X icon --></svg>
      </button>
      <span>{{ getLabel(item) }}</span>
    </div>
    <select class="select-field" [(ngModel)]="selectedValue" (change)="onSelect()">
      <option value="" disabled selected>Select</option>
      <option *ngFor="let opt of options" [value]="opt.value">{{ opt.label }}</option>
    </select>
    <svg class="select-chevron"><!-- Chevron down --></svg>
  </div>
</ui-form-field>
```

```scss
.select-with-pill {
  position: relative;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  width: 100%;
  min-height: 40px;
  padding: 8px 12px;
  background: white;
  border: 1px solid #e4e4e7;
  border-radius: 6px;
  box-sizing: border-box;

  .select-placeholder {
    font-size: 14px;
    color: #71717a;
    pointer-events: none;
  }

  .pill {
    position: relative;
    z-index: 1;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 4px 10px;
    background: #18181b;
    border-radius: 9999px;
    font-size: 12px;
    font-weight: 500;
    color: #fafafa;
  }

  .select-field {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    opacity: 0;
    cursor: pointer;
  }

  .select-chevron {
    position: absolute;
    right: 12px;
    top: 50%;
    transform: translateY(-50%);
    pointer-events: none;
  }
}
```

### 6. Signals for State Management

```typescript
// Use signals for reactive state
isEditMode = signal(false);
items = signal<Item[]>([]);
selectedIds = signal<Set<string>>(new Set());

// Computed values
totalItems = computed(() => this.items().length);
isAllSelected = computed(() => 
  this.selectedIds().size === this.items().length
);

// Update signals
this.items.update(list => [...list, newItem]);
this.selectedIds.update(ids => {
  const newSet = new Set(ids);
  newSet.add(id);
  return newSet;
});
```

### 7. Table Row/Cell Heights (Consistent Styling)

```scss
.table-wrapper {
  border: 1px solid #e4e4e7;
  border-radius: 6px;
  overflow: hidden;

  ::ng-deep .data-table {
    border: none;
    border-radius: 0;
    background: transparent;

    &__header-row,
    &__header-cell {
      background: white;
      height: auto;
      padding: 16px;  // Header cells
    }

    &__row {
      background: transparent;
      &:hover { background: #fafafa; }
    }

    &__cell {
      background: transparent;
      height: auto;
      padding: 8px 16px;  // Data cells (shorter)
    }
  }
}
```

### 8. Pagination Component Usage

```html
<!-- CORRECT: Use totalItems and itemsPerPage -->
<ui-pagination
  [currentPage]="currentPage()"
  [totalItems]="totalItems()"
  [itemsPerPage]="itemsPerPage()"
  (pageChange)="onPageChange($event)"
></ui-pagination>

<!-- WRONG: Don't use totalPages - it's computed internally -->
```

### 9. Table Container Styling (IMPORTANT!)

All list pages must use transparent backgrounds for table rows:

```scss
.table-container {
  background: transparent;  // NOT white!
}

::ng-deep .data-table {
  &__row {
    background: transparent;
    &:hover { background: #fafafa; }
  }
}
```

### 10. Document Action Dropdown Pattern

For tables with documents that need actions (Rename, Download, Delete):

```html
<!-- 3-dots button in table row -->
<div class="dropdown-container">
  <button class="btn-actions" (click)="toggleDocumentDropdown(row.id, $event)">
    <svg><!-- 3 dots icon --></svg>
  </button>
  <div class="dropdown-menu" *ngIf="activeDocumentDropdown() === row.id">
    <button class="dropdown-item" (click)="openRenameModal(row)">Rename</button>
    <button class="dropdown-item" (click)="downloadDocument(row)">Download</button>
    <button class="dropdown-item dropdown-item--danger" (click)="deleteDocument(row)">Delete</button>
  </div>
</div>
```

### 11. Rename Modal Pattern

```html
<ui-modal [isOpen]="renameModalOpen()" (close)="closeRenameModal()">
  <div class="rename-modal">
    <div class="rename-modal__header">
      <h3>Rename</h3>
      <button class="btn-close" (click)="closeRenameModal()">×</button>
    </div>
    <div class="rename-modal__content">
      <ui-form-field label="Name">
        <input type="text" [value]="renameValue()" (input)="onRenameInput($event)" />
      </ui-form-field>
    </div>
    <div class="rename-modal__actions">
      <button class="btn btn--outline" (click)="closeRenameModal()">Cancel</button>
      <button class="btn btn--primary" (click)="confirmRename()">Save</button>
    </div>
  </div>
</ui-modal>
```

```scss
.rename-modal {
  width: 400px;
  
  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 20px;
    border-bottom: 1px solid #e4e4e7;
    
    h3 { margin: 0; font-size: 16px; font-weight: 600; }
  }
  
  &__content {
    padding: 16px 20px;
  }
  
  &__actions {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    padding: 16px 20px;
    border-top: 1px solid #e4e4e7;
  }
}
```

### 12. Single Selection Role Pattern (Radio-like)

For when a user can only have ONE role (not multi-select):

```typescript
// Model
export interface User {
  role: RoleType | null;  // Single role, NOT roles[]
}

// Component
isRoleSelected(roleId: RoleType): boolean {
  return this.user().role === roleId;
}

selectRole(roleId: RoleType): void {
  this.user.update(u => ({ ...u, role: roleId }));
}
```

```html
<!-- Role selection as clickable cards -->
<div class="role-item" 
     *ngFor="let role of roleOptions"
     (click)="selectRole(role.id)"
     [class.role-item--selected]="isRoleSelected(role.id)">
  <div class="role-checkbox">
    <svg *ngIf="isRoleSelected(role.id)"><!-- Check icon --></svg>
  </div>
  <span class="role-name">{{ role.label }}</span>
</div>
```

```scss
.role-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border: 1px solid #e4e4e7;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  
  &--selected {
    background: #18181b;
    border-color: #18181b;
    
    .role-name { color: white; }
    .role-checkbox {
      border-color: white;
      svg { color: white; }
    }
  }
}
```

### 13. Loading Mock Data Directly (Preferred Pattern)

Instead of using HttpClient for mock data, import directly:

```typescript
// PREFERRED: Direct import
import { mockItems } from '@core/mocks/mock-data';

ngOnInit(): void {
  this.items.set(mockItems as Item[]);
}

// ALTERNATIVE: Dynamic import (for lazy loading)
private loadData(): void {
  import('@core/mocks/mock-data').then(({ mockItems }) => {
    this.items.set(mockItems as Item[]);
    this.cdr.markForCheck();
  });
}
```

---

## Styling Conventions

### Button Classes
```scss
.btn                    // Base button
.btn--primary           // Primary action (red #dc2626)
.btn--outline           // Outlined button
.btn--text              // Text-only button
.btn--icon              // Icon-only button (40x40)
.btn--ghost             // Transparent background
```

### Badge Variants
```html
<ui-badge variant="default">Default</ui-badge>
<ui-badge variant="primary">Primary</ui-badge>
<ui-badge variant="success">Active</ui-badge>    <!-- Green #237804 -->
<ui-badge variant="warning">Warning</ui-badge>
<ui-badge variant="danger">Inactive</ui-badge>   <!-- Red #dc2626 -->
<ui-badge variant="info">Info</ui-badge>         <!-- Purple #3B0075 -->
<ui-badge variant="dark">Dark</ui-badge>         <!-- Dark #18181b -->
```

### Standard Colors
```scss
$background-page: #f4f4f5;
$background-white: #ffffff;
$border-color: #e4e4e7;
$text-primary: #232323;
$text-secondary: #71717a;
$primary-red: #dc2626;
$primary-red-hover: #b91c1c;
$success-green: #237804;
$muted-row: #f4f4f5;
```

---

## Common Issues & Solutions

### Component not updating with OnPush
Inject `ChangeDetectorRef` and call `detectChanges()` or `markForCheck()` after async updates.

### Form fields not clearing on route change
Subscribe to `route.paramMap` and implement form reset logic.

### Tables looking different from Figma
- Use `ui-data-table` component with custom templates
- Apply `height: auto` and proper padding to cells
- Ensure `.table-wrapper` has border and `overflow: hidden`

### Wrong import paths
Use `@app/ui-kit/atoms/...`, `@app/ui-kit/molecules/...`, `@app/ui-kit/organisms/...`

### Double borders on tables
- Remove border from `::ng-deep .data-table`
- Apply border only to `.table-wrapper`

### Pagination not working
- Use `totalItems` and `itemsPerPage` inputs, NOT `totalPages`
- The component computes `totalPages` internally

### Select fields overlapping
- Use the `.select-with-pill` pattern with `opacity: 0` on the select
- Add visible placeholder text when no items selected

### Table rows showing white background
- Set `.table-container { background: transparent; }`
- Ensure `::ng-deep .data-table__row { background: transparent; }`

### Title size inconsistent
- Use `.list-header__title { font-size: 20px; font-weight: 600; }` for list pages
- Match Figma specifications exactly

### Tabs container styling
- For detail pages with tabs: `border: 1px solid #E4E4E7; border-radius: 6px;`
- Remove white background if not needed: `background: transparent;`
- Remove padding from `.tab-content` when tab fills entire container

### Rich text editor in tabs
- Should fill from top to bottom without extra borders
- Use `border: none; background: transparent;` for textarea styling
- Font color should be black (#232323)

### Model naming conflicts
- `UserRole` exists in `auth.model.ts` for authentication
- Use `AdminUserRoleType` for admin user management to avoid conflicts
- Always prefix model names with context when similar names exist

---

## AI Development Guide: Lessons Learned

### For Future AI Prompts

When working on new pages/features, include these instructions:

```
CRITICAL REQUIREMENTS:
1. ALWAYS check existing implementations before creating new code
2. REUSE existing UI Kit components (ui-data-table, ui-badge, ui-pagination, etc.)
3. FOLLOW the same file structure and naming conventions
4. COPY styling patterns from similar existing pages
5. Use SIGNALS for state management, not component properties
6. Use OnPush change detection with manual change detection when needed

BEFORE IMPLEMENTING:
- Read the corresponding Figma design carefully
- Check similar existing pages for patterns (products, accounts, contacts)
- Identify which UI Kit components to reuse
- Note specific Figma details: colors, spacing, heights, borders

COMMON PITFALLS TO AVOID:
1. Creating custom table implementations instead of using ui-data-table
2. Using wrong pagination props (totalPages vs totalItems/itemsPerPage)
3. Inconsistent table row heights (header: 16px padding, data: 8px 16px)
4. Double borders from both wrapper and table
5. Custom select implementations instead of the .select-with-pill pattern
6. Forgetting to call cdr.detectChanges() after ViewChild template init
7. Using wrong badge variants (check Figma for exact colors)
8. Inconsistent button styling (check .btn--primary vs .btn--outline)

TABLE STYLING CHECKLIST:
- [ ] .table-wrapper has border and border-radius
- [ ] .table-wrapper has overflow: hidden
- [ ] ::ng-deep .data-table has border: none
- [ ] Header cells: height: auto, padding: 16px
- [ ] Data cells: height: auto, padding: 8px 16px
- [ ] Rows have transparent background

FORM STYLING CHECKLIST:
- [ ] Using ui-form-field with layout="horizontal"
- [ ] Labels are 128px wide
- [ ] Select fields use .select-with-pill pattern
- [ ] Pills have correct styling (#18181b background)
```

### Key Questions to Ask Before Starting

1. **What existing page is most similar?** - Copy its structure
2. **Which UI Kit components are needed?** - List them explicitly
3. **What are the exact Figma specifications?** - Heights, colors, spacing
4. **Is it a list page or detail page?** - Different patterns apply
5. **Does it need custom templates?** - For status badges, actions, etc.

### Recommended Workflow

1. **Get Figma context first** - Use Figma MCP tool
2. **Read similar existing implementation** - Products, Discounts, etc.
3. **Create component with correct structure** - Don't reinvent
4. **Style incrementally** - Match Figma exactly
5. **Test all interactions** - Dropdowns, selection, navigation
6. **Verify consistency** - Heights, borders, colors match other pages

---

## Testing Locally

1. **Start the dev server**:
   ```bash
   npm start
   ```

2. **Access the app**: http://localhost:4200

3. **Login credentials** (mock):
   - Any email/password combination works
   - The mock interceptor returns a super_admin user by default

4. **Mock data** is returned for all API calls - no backend needed

---

## Key Files Reference

| Purpose | File |
|---------|------|
| Routes | `src/app/app.routes.ts` |
| Mock Data | `src/app/core/mocks/mock-data.ts` |
| Mock Interceptor | `src/app/core/mocks/mock.interceptor.ts` |
| Models | `src/app/core/models/` |
| Sidebar | `src/app/layout/sidebar/sidebar.component.*` |
| Main Layout | `src/app/layout/main-layout/main-layout.component.*` |
| Products (reference) | `src/app/features/admin/products/` |
| Discounts (reference) | `src/app/features/admin/discounts/` |
| Payment Types (with tabs/docs) | `src/app/features/admin/payment-types/` |
| Delivery Prices (select-pill) | `src/app/features/admin/delivery-prices/` |
| Users (role selection) | `src/app/features/admin/users/` |

---

## Remaining Work

### Completed (Super Admin)
- [x] Countries page
- [x] Tax Types page
- [x] Payment Types page (with documents, tabs, rename modal)
- [x] Delivery Types page (with documents, tabs, rename modal)
- [x] Warehouses page
- [x] Delivery Prices page (with select-with-pill)
- [x] Fuel Surcharges page
- [x] Packaging Prices page
- [x] Admin Users page (with single role selection)

### Pages Not Yet Implemented

#### Customer Admin Pages
- [ ] Customer Admin Dashboard
- [ ] Customer Management
- [ ] Order Management (customer-specific)
- [ ] Product Catalog (customer view)
- [ ] Price Lists
- [ ] Account Settings

#### Customer Pages
- [ ] Customer Dashboard
- [ ] Product Browsing
- [ ] Shopping Cart
- [ ] Order History
- [ ] Account Profile

#### Other Admin Pages
- [ ] Active Inquiries page (`/admin/active-inquiries`)
- [ ] Reports & Analytics

### Potential Improvements
- [ ] Add loading states with ui-shimmer
- [ ] Implement actual API integration
- [ ] Add form validation
- [ ] Add confirmation dialogs for destructive actions
- [ ] Implement bulk actions properly
- [ ] Add toast notifications for save/delete actions

---

## Key Models Reference

### Super Admin Models (in `@core/models/`)

| Model | File | Key Fields |
|-------|------|------------|
| `Country` | `country.model.ts` | id, name, taxRate, dhlZone, isEu, isActive |
| `TaxType` | `tax-type.model.ts` | id, name, description, isActive |
| `PaymentType` | `payment-type.model.ts` | id, name, shortDescription, isActive, documents[] |
| `DeliveryType` | `delivery-type.model.ts` | id, name, shortDescription, isActive, documents[] |
| `Warehouse` | `warehouse.model.ts` | id, name, address, isActive |
| `DeliveryPrice` | `delivery-price.model.ts` | id, deliveryType, dhlZone, weightFrom, weightTo, price, isActive |
| `FuelSurcharge` | `fuel-surcharge.model.ts` | id, name, percentage, validFrom, validTo, isActive |
| `PackagingPrice` | `packaging-price.model.ts` | id, name, price, description, isActive |
| `AdminUser` | `admin-user.model.ts` | id, firstName, lastName, username, email, role (single) |

---

## Sidebar Configuration

Links are organized in `sidebar.component.html` with padding `3px 8px`:

```html
<!-- Super Admin sections -->
<div class="sidebar__section">
  <span class="sidebar__section-title">CODEBOOK</span>
  <a routerLink="/admin/countries" class="sidebar__link">Countries</a>
  <a routerLink="/admin/tax-types" class="sidebar__link">Tax types</a>
  <a routerLink="/admin/payment-types" class="sidebar__link">Payment types</a>
  <a routerLink="/admin/delivery-types" class="sidebar__link">Delivery types</a>
  <a routerLink="/admin/warehouses" class="sidebar__link">Warehouse</a>
</div>

<div class="sidebar__section">
  <span class="sidebar__section-title">ECOMMERCE HUB</span>
  <a routerLink="/admin/delivery-prices" class="sidebar__link">Delivery price</a>
  <a routerLink="/admin/fuel-surcharges" class="sidebar__link">Fuel surcharge</a>
  <a routerLink="/admin/packaging-prices" class="sidebar__link">Packaging price</a>
</div>

<div class="sidebar__section">
  <span class="sidebar__section-title">USER HUB</span>
  <a routerLink="/admin/users" class="sidebar__link">Users</a>
</div>
```

---

*Last Updated: January 6, 2026*
