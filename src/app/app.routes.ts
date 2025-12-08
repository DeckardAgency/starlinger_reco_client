import { Routes } from '@angular/router';
import { AuthGuard } from '@core/auth/auth.guard';

export const routes: Routes = [
  // ============================================================================
  // PUBLIC ROUTES
  // ============================================================================
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  },
  {
    path: 'login',
    loadComponent: () => import('@features/login/login.component').then(m => m.LoginComponent),
    title: 'Reco | Login'
  },

  // ============================================================================
  // AUTHENTICATED ROUTES
  // ============================================================================
  {
    path: 'dashboard',
    loadComponent: () => import('@features/dashboard/dashboard.component').then(m => m.DashboardComponent),
    canActivate: [AuthGuard],
    title: 'Reco | Dashboard'
  },
  {
    path: 'products',
    loadComponent: () => import('@features/products/products.component').then(m => m.ProductsComponent),
    canActivate: [AuthGuard],
    title: 'Reco | Products'
  },
  {
    path: 'ui-kit',
    loadComponent: () => import('@features/ui-kit-docs/ui-kit-docs.component').then(m => m.UiKitDocsComponent),
    canActivate: [AuthGuard],
    title: 'Reco | UI Kit'
  },

  // ============================================================================
  // WILDCARD - Redirect unknown routes to dashboard
  // ============================================================================
  {
    path: '**',
    redirectTo: 'dashboard'
  }
];
