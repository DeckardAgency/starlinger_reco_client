# Starlinger Reco Client - Coding Standards

## Architecture

### Atomic Design Structure
```
src/app/ui-kit/
├── atoms/          # Basic building blocks (button, input, badge, icon)
├── molecules/      # Composite components (card, form-field, tabs, toast)
├── organisms/      # Complex sections (modal, data-table, drawer)
└── index.ts        # Barrel export
```

### Feature Structure
```
src/app/
├── core/           # Services, guards, interceptors, models
├── features/       # Page-level components (lazy-loaded)
├── layout/         # Shell components (sidebar, topbar)
├── shared/         # Domain-specific shared components
└── ui-kit/         # Design system (atomic)
```

---

## Component Patterns

### Selector Naming
- UI Kit: `ui-*` (e.g., `ui-button`, `ui-card`)
- Features: `app-*` (e.g., `app-dashboard`, `app-login`)

### Component Template
```typescript
import { Component, ChangeDetectionStrategy, Input, Output, EventEmitter, booleanAttribute } from '@angular/core';
import { CommonModule } from '@angular/common';

export type ComponentVariant = 'default' | 'primary' | 'secondary';
export type ComponentSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'ui-component-name',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './component-name.component.html',
  styleUrls: ['./component-name.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ComponentNameComponent {
  @Input() variant: ComponentVariant = 'default';
  @Input() size: ComponentSize = 'md';
  @Input({ transform: booleanAttribute }) disabled = false;
  @Input({ transform: booleanAttribute }) loading = false;

  @Output() clicked = new EventEmitter<void>();

  get componentClasses(): string[] {
    const classes = [
      'ui-component-name',
      `ui-component-name--${this.variant}`,
      `ui-component-name--${this.size}`
    ];

    if (this.disabled) {
      classes.push('ui-component-name--disabled');
    }

    return classes;
  }
}
```

### Required Patterns
| Pattern | Requirement |
|---------|-------------|
| Change Detection | `OnPush` always |
| Components | Standalone |
| Boolean Inputs | Use `booleanAttribute` transform |
| Type Exports | Export types alongside component |
| Dynamic Classes | Use getter returning `string[]` |

---

## TypeScript

### Strict Mode
- `strict: true` enabled
- No implicit any
- Explicit return types on public methods

### Path Aliases
```typescript
import { AuthService } from '@core/auth/auth.service';
import { ButtonComponent } from '@app/ui-kit';
import { User } from '@models/auth.model';
import { DashboardComponent } from '@features/dashboard/dashboard.component';
```

### Available Aliases
- `@core/*` → `src/app/core/*`
- `@features/*` → `src/app/features/*`
- `@shared/*` → `src/app/shared/*`
- `@models/*` → `src/app/core/models/*`
- `@services/*` → `src/app/core/services/*`
- `@utils/*` → `src/app/utils/*`
- `@app/ui-kit` → `src/app/ui-kit/index.ts`
- `@app/ui-kit/*` → `src/app/ui-kit/*`

---

## SCSS / Styling

### BEM-like Naming
```scss
.ui-card {
  // Base styles

  &--elevated {
    // Variant modifier
  }

  &--padding-lg {
    // Size modifier
  }

  &__header {
    // Element
  }

  &__body {
    // Element
  }

  &--disabled {
    // State modifier
  }
}
```

### Component Scoping
- All styles scoped to component
- Use `:host` for component-level styles
- No global styles except in `styles.scss`

---

## RxJS & State

### Subscription Cleanup
```typescript
private destroyRef = inject(DestroyRef);

ngOnInit(): void {
  this.someService.data$.pipe(
    takeUntilDestroyed(this.destroyRef)
  ).subscribe(data => {
    // handle
  });
}
```

### Local State
```typescript
// Use signals for local UI state
isOpen = signal<boolean>(false);
selectedItem = signal<Item | null>(null);

// Toggle pattern
toggle() {
  this.isOpen.update(value => !value);
}
```

### Async Pipe Preference
```html
<!-- Preferred -->
<div *ngIf="data$ | async as data">{{ data.name }}</div>

<!-- Avoid manual subscriptions in templates -->
```

---

## File Organization

### Barrel Exports
Every folder with multiple exports has `index.ts`:
```typescript
// atoms/index.ts
export * from './button/button.component';
export * from './input/input.component';
export * from './badge/badge.component';
```

### File Naming
- Components: `component-name.component.ts`
- Services: `service-name.service.ts`
- Guards: `guard-name.guard.ts`
- Models: `model-name.model.ts`
- Pipes: `pipe-name.pipe.ts`

---

## Routing

### Lazy Loading
```typescript
{
  path: 'feature',
  loadComponent: () => import('@features/feature/feature.component').then(m => m.FeatureComponent),
  canActivate: [AuthGuard],
  title: 'Reco | Feature'
}
```

---

## Testing

- E2E: Playwright (`e2e/` folder)
- Unit: Jasmine (`.spec.ts` files)

---

## DO NOT

- Use `any` type
- Skip `OnPush` change detection
- Create NgModules (use standalone)
- Use inline styles
- Import from relative paths when alias exists
- Create components without proper typing
- Skip barrel exports for new components
- Use `subscribe()` without cleanup

---

## Brand Colors (from Figma)

| Color | Hex | Usage |
|-------|-----|-------|
| Primary Red | `#DC1B30` | Buttons, accents, Starlinger brand |
| Danger Red | `#DC2626` | Error states, destructive actions |
| Background | `#FAFAFA` | Page background |
| White | `#FFFFFF` | Cards, modals |
| Text Primary | `#18181B` | Main text |
| Text Secondary | `#71717A` | Labels, placeholders |
| Border | `#E4E4E7` | Dividers, input borders |

---

## Existing Components Reference

### Atoms
`button`, `input`, `textarea`, `select`, `checkbox`, `toggle`, `badge`, `avatar`, `icon`, `spinner`, `shimmer`, `divider`, `link`

### Molecules
`card`, `form-field`, `tabs`, `toast`, `pagination`, `search`, `dropdown`, `breadcrumbs`, `calendar`, `carousel`, `file-upload`, `empty-state`, `quantity-selector`, `price-display`, `accordion`

### Organisms
`modal`, `data-table`, `card-grid`, `drawer`, `toast-container`

---

*Last updated: December 2024*

