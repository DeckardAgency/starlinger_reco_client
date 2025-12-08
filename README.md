# Starlinger Reco Client

Angular 20 web application for the Starlinger Reco project.

## Prerequisites

- **Node.js**: v20.19+ or v22.12+ (recommended: v22.14.0)
- **npm**: v10.9+
- **Angular CLI**: v20.3.2

### Node Version Management

We recommend using [nvm](https://github.com/nvm-sh/nvm) to manage Node.js versions:

```bash
# Install Node 22
nvm install 22

# Use Node 22
nvm use 22
```

## Installation

```bash
# Clone the repository
git clone <repository-url>
cd starlinger_reco_client

# Install dependencies
npm install
```

## Development Server

```bash
# Start the development server
npm start

# Or with Angular CLI
ng serve
```

Navigate to `http://localhost:4200/`. The application will automatically reload on file changes.

### Development Authentication

For development purposes, dummy authentication is enabled. Use these credentials:

- **Email**: `recouser@starlinger.com`
- **Password**: `recouser123!`

This bypasses the API and uses mock user data. To disable dummy auth, set `useDummyAuth: false` in `src/environments/environment.ts`.

## Build

```bash
# Development build
npm run build

# Production build
npm run build -- --configuration production

# Watch mode
npm run watch
```

Build artifacts are stored in the `dist/` directory.

## Testing

### Unit Tests

```bash
# Run unit tests with Karma
npm test
```

### End-to-End Tests

```bash
# Run Playwright tests
npm run e2e

# Run tests with UI
npm run e2e:ui

# Run tests in headed mode
npm run e2e:headed

# Debug tests
npm run e2e:debug

# Generate test code
npm run e2e:codegen

# View test report
npm run e2e:report
```

## Project Structure

```
src/app/
├── core/                    # Core module (singleton services, guards, models)
│   ├── auth/               # Authentication (AuthService, AuthGuard)
│   ├── models/             # Data models and interfaces
│   └── services/           # Core services (HTTP, Logger, etc.)
│
├── features/               # Feature modules (lazy-loaded)
│   ├── dashboard/          # Dashboard feature
│   ├── login/              # Login page
│   ├── products/           # Products listing
│   └── ui-kit-docs/        # UI Kit documentation page
│
├── layout/                 # Layout components
│   ├── sidebar/            # Main sidebar navigation
│   ├── topbar/             # Top navigation bar
│   └── mobile-menu/        # Mobile navigation
│
├── shared/                 # Shared module
│   ├── components/         # Reusable components
│   └── pipes/              # Custom pipes (PriceFilterPipe, etc.)
│
├── ui-kit/                 # UI Component Library (Atomic Design)
│   ├── atoms/              # Basic components (Button, Input, Badge, etc.)
│   ├── molecules/          # Composite components (Card, Tabs, Form Field, etc.)
│   └── organisms/          # Complex components (Modal, DataTable, Drawer, etc.)
│
└── utils/                  # Utility functions and helpers
```

## UI Kit

The application includes a comprehensive UI component library following Atomic Design principles.

### Accessing UI Kit Documentation

Navigate to `/ui-kit` in the application to view the interactive component documentation.

### Available Components

**Atoms:**
- Button, Icon, Input, Textarea, Badge, Shimmer, Spinner
- Avatar, Checkbox, Select, Divider, Link, Toggle

**Molecules:**
- Form Field, Card, Toast, Tabs, Dropdown, File Upload
- Breadcrumbs, Empty State, Pagination, Search, Calendar
- Carousel, Quantity Selector, Price Display, Accordion

**Organisms:**
- Modal, Data Table, Card Grid, Drawer

### Usage Example

```typescript
import { ButtonComponent, InputComponent } from '@app/ui-kit';

@Component({
  imports: [ButtonComponent, InputComponent],
  template: `
    <ui-button variant="primary" (clicked)="onSubmit()">Submit</ui-button>
    <ui-input placeholder="Enter text" [(ngModel)]="value"></ui-input>
  `
})
export class MyComponent {}
```

## Environment Configuration

Environment files are located in `src/environments/`:

- `environment.ts` - Development configuration
- `environment.prod.ts` - Production configuration

### Configuration Options

```typescript
export const environment = {
  production: false,
  apiBaseUrl: 'https://127.0.0.1:8002',  // API base URL for assets
  apiPath: '/api/v1',                     // API endpoint path
  serverUrl: 'https://127.0.0.1:8002',    // SSR server URL
  useDummyAuth: true                      // Enable/disable dummy auth
};
```

## Code Style

- **Component Architecture**: Standalone components with OnPush change detection
- **CSS Methodology**: BEM (Block Element Modifier)
- **State Management**: Angular Signals for reactive state
- **Styling**: SCSS with component-scoped styles

## Path Aliases

TypeScript path aliases are configured in `tsconfig.json`:

```json
{
  "@app/*": ["src/app/*"],
  "@core/*": ["src/app/core/*"],
  "@shared/*": ["src/app/shared/*"],
  "@features/*": ["src/app/features/*"],
  "@layout/*": ["src/app/layout/*"],
  "@env/*": ["src/environments/*"]
}
```

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm start` | Start development server |
| `npm run build` | Build the application |
| `npm run watch` | Build with watch mode |
| `npm test` | Run unit tests |
| `npm run e2e` | Run E2E tests |
| `npm run e2e:ui` | Run E2E tests with UI |

## SSR (Server-Side Rendering)

The application supports server-side rendering:

```bash
# Build for SSR
npm run build

# Serve SSR build
npm run serve:ssr:starlinger_reco_client
```

## Contributing

1. Create a feature branch from `main`
2. Make your changes following the code style guidelines
3. Write/update tests as needed
4. Submit a pull request

## License

Proprietary - Starlinger & Co. GmbH
