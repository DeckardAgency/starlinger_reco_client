import { Routes } from '@angular/router';
import { AuthGuard } from '@core/auth/auth.guard';
import { RoleGuard } from '@core/auth/role.guard';

export const routes: Routes = [
  // ============================================================================
  // PUBLIC ROUTES
  // ============================================================================
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },
  {
    path: 'login',
    loadComponent: () => import('@features/login/login.component').then(m => m.LoginComponent),
    title: 'Reco | Login'
  },
  {
    path: 'forgot-password',
    loadComponent: () => import('@features/forgot-password/forgot-password.component').then(m => m.ForgotPasswordComponent),
    title: 'Reco | Reset Password'
  },
  {
    path: 'register',
    loadComponent: () => import('@features/register/register.component').then(m => m.RegisterComponent),
    title: 'Reco | Create Account'
  },
  {
    path: 'no-client',
    loadComponent: () => import('@features/no-client/no-client.component').then(m => m.NoClientComponent),
    title: 'Reco | Account Not Configured'
  },

  // ============================================================================
  // SUPER ADMIN ROUTES - Redirected to Admin Client (port 4201)
  // ============================================================================
  {
    path: 'admin',
    redirectTo: '/login',
    pathMatch: 'prefix'
  },

  // ============================================================================
  // CUSTOMER ADMIN ROUTES
  // ============================================================================
  {
    path: 'customer-admin',
    canActivate: [AuthGuard],
    children: [
      {
        path: '',
        redirectTo: 'orders',
        pathMatch: 'full'
      },
      // Orders with filter support (History, Drafts, Archive, Bin)
      {
        path: 'orders',
        loadComponent: () => import('@features/customer-admin/orders/orders.component').then(m => m.OrdersComponent),
        title: 'Reco | History'
      },
      {
        path: 'orders/drafts',
        loadComponent: () => import('@features/customer-admin/orders/orders.component').then(m => m.OrdersComponent),
        data: { filter: 'drafts' },
        title: 'Reco | Drafts'
      },
      {
        path: 'orders/archive',
        loadComponent: () => import('@features/customer-admin/orders/orders.component').then(m => m.OrdersComponent),
        data: { filter: 'archive' },
        title: 'Reco | Archive'
      },
      {
        path: 'orders/bin',
        loadComponent: () => import('@features/customer-admin/orders/orders.component').then(m => m.OrdersComponent),
        data: { filter: 'bin' },
        title: 'Reco | Bin'
      },
      // Order detail
      {
        path: 'orders/:id',
        loadComponent: () => import('@features/customer-admin/orders/order-detail/order-detail.component').then(m => m.OrderDetailComponent),
        title: 'Reco | Order Detail'
      },
      // Users
      {
        path: 'users',
        loadComponent: () => import('@features/customer-admin/users/users.component').then(m => m.UsersComponent),
        title: 'Reco | Users'
      },
      // Company profile
      {
        path: 'company',
        loadComponent: () => import('@features/customer-admin/company/company.component').then(m => m.CompanyComponent),
        title: 'Reco | My Company'
      },
      // Settings
      {
        path: 'settings',
        loadComponent: () => import('@features/customer-admin/settings/settings.component').then(m => m.SettingsComponent),
        title: 'Reco | Settings'
      },
      // Support
      {
        path: 'support',
        loadComponent: () => import('@features/customer-admin/support/support.component').then(m => m.SupportComponent),
        title: 'Reco | Support'
      },
      // Documentation
      {
        path: 'documentation',
        loadComponent: () => import('@features/customer-admin/documentation/documentation.component').then(m => m.DocumentationComponent),
        title: 'Reco | Documentation'
      }
    ]
  },

  // ============================================================================
  // CUSTOMER ROUTES (Client/User)
  // ============================================================================
  {
    path: 'customer',
    canActivate: [AuthGuard],
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      // Dashboard
      {
        path: 'dashboard',
        loadComponent: () => import('@features/customer/dashboard/customer-dashboard.component').then(m => m.CustomerDashboardComponent),
    title: 'Reco | Dashboard'
      },
      // My Clients (client agents only)
      {
        path: 'my-clients',
        loadComponent: () => import('@features/customer/my-clients/my-clients.component').then(m => m.MyClientsComponent),
        canActivate: [RoleGuard],
        data: { roles: ['ROLE_USER_CLIENT_AGENT'] },
        title: 'Reco | My Clients'
      },
      {
        path: 'my-clients/:id/view',
        loadComponent: () => import('@features/customer/my-clients/client-detail/client-detail.component').then(m => m.ClientDetailComponent),
        canActivate: [RoleGuard],
        data: { roles: ['ROLE_USER_CLIENT_AGENT'] },
        title: 'Reco | Client Details'
      },
      // Shop
      {
        path: 'shop',
        children: [
          {
            path: '',
            redirectTo: 'products',
            pathMatch: 'full'
          },
          {
            path: 'products',
            loadComponent: () => import('@features/customer/shop/shop.component').then(m => m.ShopComponent),
            title: 'Reco | All Products'
          },
          {
            path: 'products/:id',
            loadComponent: () => import('@features/customer/shop/product-detail/product-detail.component').then(m => m.ProductDetailComponent),
            title: 'Reco | Product Details'
          },
          {
            path: 'cart',
            loadComponent: () => import('@features/customer/shop/cart/cart.component').then(m => m.CartComponent),
            title: 'Reco | Cart'
          },
          {
            path: 'wishlist',
            loadComponent: () => import('@features/customer/shop/wishlist-page/wishlist-page.component').then(m => m.WishlistPageComponent),
            title: 'Reco | Wishlist'
          },
          {
            path: 'checkout',
            loadComponent: () => import('@features/customer/shop/checkout/checkout.component').then(m => m.CheckoutComponent),
            title: 'Reco | Checkout'
          },
          {
            path: 'order-success',
            loadComponent: () => import('@features/customer/shop/order-success/order-success.component').then(m => m.OrderSuccessComponent),
            title: 'Reco | Order Success'
          }
        ]
      },
      // Orders
      {
        path: 'orders',
        loadComponent: () => import('@features/customer-admin/orders/orders.component').then(m => m.OrdersComponent),
        title: 'Reco | My Orders'
      },
      {
        path: 'orders/archive',
        loadComponent: () => import('@features/customer-admin/orders/orders.component').then(m => m.OrdersComponent),
        data: { filter: 'archive' },
        title: 'Reco | Order Archive'
      },
      {
        path: 'orders/drafts',
        loadComponent: () => import('@features/customer-admin/orders/orders.component').then(m => m.OrdersComponent),
        data: { filter: 'drafts' },
        title: 'Reco | Drafts'
      },
      {
        path: 'orders/:id',
        loadComponent: () => import('@features/customer-admin/orders/order-detail/order-detail.component').then(m => m.OrderDetailComponent),
        title: 'Reco | Order Detail'
      },
      // Support
      {
        path: 'support',
        loadComponent: () => import('@features/customer/support/support.component').then(m => m.SupportComponent),
        title: 'Reco | Support'
      },
      // Documentation
      {
        path: 'documentation',
        loadComponent: () => import('@features/customer/documentation/documentation.component').then(m => m.DocumentationComponent),
        title: 'Reco | Documentation'
      },
      // Settings
      {
        path: 'settings',
        loadComponent: () => import('@features/customer/settings/settings.component').then(m => m.SettingsComponent),
        title: 'Reco | Settings'
      }
    ]
  },
  // Legacy routes for backward compatibility
  {
    path: 'dashboard',
    redirectTo: 'customer/dashboard',
    pathMatch: 'full'
  },
  {
    path: 'shop',
    redirectTo: 'customer/shop',
    pathMatch: 'full'
  },
  {
    path: 'search',
    loadComponent: () => import('@features/customer/search/search.component').then(m => m.SearchComponent),
    canActivate: [AuthGuard],
    title: 'Reco | Search'
  },
  {
    path: 'status',
    loadComponent: () => import('@features/customer/status/status.component').then(m => m.StatusComponent),
    canActivate: [AuthGuard],
    title: 'Reco | Status & Notifications'
  },

  // ============================================================================
  // SHARED/UTILITY ROUTES
  // ============================================================================
  {
    path: 'ui-kit',
    loadComponent: () => import('@features/ui-kit-docs/ui-kit-docs.component').then(m => m.UiKitDocsComponent),
    canActivate: [AuthGuard],
    title: 'Reco | UI Kit'
  },

  // ============================================================================
  // 404 - Not Found
  // ============================================================================
  {
    path: '404',
    loadComponent: () => import('@shared/components/not-found/not-found.component').then(m => m.NotFoundComponent),
    title: 'Reco | Page Not Found'
  },

  // ============================================================================
  // WILDCARD - Redirect unknown routes to 404
  // ============================================================================
  {
    path: '**',
    redirectTo: '404'
  }
];
