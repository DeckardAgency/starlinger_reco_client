import { Routes } from '@angular/router';
import { AuthGuard } from '@core/auth/auth.guard';
import { RoleGuard } from '@core/auth/role.guard';
import { USER_ROLES } from '@core/models/auth.model';

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

  // ============================================================================
  // SUPER ADMIN ROUTES (Starlinger Admin)
  // ============================================================================
  {
    path: 'admin',
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: [USER_ROLES.SUPER_ADMIN] },
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        loadComponent: () => import('@features/admin/dashboard/admin-dashboard.component').then(m => m.AdminDashboardComponent),
        title: 'Reco | Admin Dashboard'
      },
      {
        path: 'accounts',
        loadComponent: () => import('@features/admin/accounts/accounts.component').then(m => m.AccountsComponent),
        title: 'Reco | Accounts'
      },
      {
        path: 'accounts/new',
        loadComponent: () => import('@features/admin/accounts/account-detail/account-detail.component').then(m => m.AccountDetailComponent),
        title: 'Reco | New Account'
      },
      {
        path: 'accounts/:id',
        loadComponent: () => import('@features/admin/accounts/account-detail/account-detail.component').then(m => m.AccountDetailComponent),
        title: 'Reco | Account Detail'
      },
      {
        path: 'contacts',
        loadComponent: () => import('@features/admin/contacts/contacts.component').then(m => m.ContactsComponent),
        title: 'Reco | Contacts'
      },
      {
        path: 'contacts/new',
        loadComponent: () => import('@features/admin/contacts/contact-detail/contact-detail.component').then(m => m.ContactDetailComponent),
        title: 'Reco | New Contact'
      },
      {
        path: 'contacts/:id',
        loadComponent: () => import('@features/admin/contacts/contact-detail/contact-detail.component').then(m => m.ContactDetailComponent),
        title: 'Reco | Contact Detail'
      },
      {
        path: 'shop-orders',
        loadComponent: () => import('@features/admin/shop-orders/shop-orders.component').then(m => m.ShopOrdersComponent),
        title: 'Reco | Shop Orders'
      },
      {
        path: 'shop-orders/:id',
        loadComponent: () => import('@features/admin/shop-orders/shop-order-detail/shop-order-detail.component').then(m => m.ShopOrderDetailComponent),
        title: 'Reco | Shop Order Detail'
      },
      {
        path: 'manual-entries',
        loadComponent: () => import('@features/admin/manual-entries/manual-entries.component').then(m => m.ManualEntriesComponent),
        title: 'Reco | Manual Entry'
      },
      {
        path: 'manual-entries/:id',
        loadComponent: () => import('@features/admin/manual-entries/manual-entry-detail/manual-entry-detail.component').then(m => m.ManualEntryDetailComponent),
        title: 'Reco | Manual Entry Detail'
      },
      {
        path: 'products',
        loadComponent: () => import('@features/admin/products/products.component').then(m => m.ProductsComponent),
        title: 'Reco | Products'
      },
      {
        path: 'products/new',
        loadComponent: () => import('@features/admin/products/product-detail/product-detail.component').then(m => m.ProductDetailComponent),
        title: 'Reco | New Product'
      },
      {
        path: 'products/:id',
        loadComponent: () => import('@features/admin/products/product-detail/product-detail.component').then(m => m.ProductDetailComponent),
        title: 'Reco | Product Detail'
      },
      {
        path: 'discounts',
        loadComponent: () => import('@features/admin/discounts/discounts.component').then(m => m.DiscountsComponent),
        title: 'Reco | Discounts'
      },
      {
        path: 'discounts/new',
        loadComponent: () => import('@features/admin/discounts/discount-detail/discount-detail.component').then(m => m.DiscountDetailComponent),
        title: 'Reco | New Discount'
      },
      {
        path: 'discounts/:id',
        loadComponent: () => import('@features/admin/discounts/discount-detail/discount-detail.component').then(m => m.DiscountDetailComponent),
        title: 'Reco | Discount Detail'
      },
      {
        path: 'countries',
        loadComponent: () => import('@features/admin/countries/countries.component').then(m => m.CountriesComponent),
        title: 'Reco | Countries'
      },
      {
        path: 'countries/new',
        loadComponent: () => import('@features/admin/countries/country-detail/country-detail.component').then(m => m.CountryDetailComponent),
        title: 'Reco | New Country'
      },
      {
        path: 'countries/:id',
        loadComponent: () => import('@features/admin/countries/country-detail/country-detail.component').then(m => m.CountryDetailComponent),
        title: 'Reco | Country Detail'
      },
      {
        path: 'tax-types',
        loadComponent: () => import('@features/admin/tax-types/tax-types.component').then(m => m.TaxTypesComponent),
        title: 'Reco | Tax Types'
      },
      {
        path: 'tax-types/new',
        loadComponent: () => import('@features/admin/tax-types/tax-type-detail/tax-type-detail.component').then(m => m.TaxTypeDetailComponent),
        title: 'Reco | New Tax Type'
      },
      {
        path: 'tax-types/:id',
        loadComponent: () => import('@features/admin/tax-types/tax-type-detail/tax-type-detail.component').then(m => m.TaxTypeDetailComponent),
        title: 'Reco | Tax Type Detail'
      },
      {
        path: 'payment-types',
        loadComponent: () => import('@features/admin/payment-types/payment-types.component').then(m => m.PaymentTypesComponent),
        title: 'Reco | Payment Types'
      },
      {
        path: 'payment-types/new',
        loadComponent: () => import('@features/admin/payment-types/payment-type-detail/payment-type-detail.component').then(m => m.PaymentTypeDetailComponent),
        title: 'Reco | New Payment Type'
      },
      {
        path: 'payment-types/:id',
        loadComponent: () => import('@features/admin/payment-types/payment-type-detail/payment-type-detail.component').then(m => m.PaymentTypeDetailComponent),
        title: 'Reco | Payment Type Detail'
      },
      {
        path: 'delivery-types',
        loadComponent: () => import('@features/admin/delivery-types/delivery-types.component').then(m => m.DeliveryTypesComponent),
        title: 'Reco | Delivery Types'
      },
      {
        path: 'delivery-types/new',
        loadComponent: () => import('@features/admin/delivery-types/delivery-type-detail/delivery-type-detail.component').then(m => m.DeliveryTypeDetailComponent),
        title: 'Reco | New Delivery Type'
      },
      {
        path: 'delivery-types/:id',
        loadComponent: () => import('@features/admin/delivery-types/delivery-type-detail/delivery-type-detail.component').then(m => m.DeliveryTypeDetailComponent),
        title: 'Reco | Delivery Type Detail'
      },
      {
        path: 'warehouses',
        loadComponent: () => import('@features/admin/warehouses/warehouses.component').then(m => m.WarehousesComponent),
        title: 'Reco | Warehouses'
      },
      {
        path: 'warehouses/new',
        loadComponent: () => import('@features/admin/warehouses/warehouse-detail/warehouse-detail.component').then(m => m.WarehouseDetailComponent),
        title: 'Reco | New Warehouse'
      },
      {
        path: 'warehouses/:id',
        loadComponent: () => import('@features/admin/warehouses/warehouse-detail/warehouse-detail.component').then(m => m.WarehouseDetailComponent),
        title: 'Reco | Warehouse Detail'
      },
      {
        path: 'delivery-prices',
        loadComponent: () => import('@features/admin/delivery-prices/delivery-prices.component').then(m => m.DeliveryPricesComponent),
        title: 'Reco | Delivery Prices'
      },
      {
        path: 'delivery-prices/new',
        loadComponent: () => import('@features/admin/delivery-prices/delivery-price-detail/delivery-price-detail.component').then(m => m.DeliveryPriceDetailComponent),
        title: 'Reco | New Delivery Price'
      },
      {
        path: 'delivery-prices/:id',
        loadComponent: () => import('@features/admin/delivery-prices/delivery-price-detail/delivery-price-detail.component').then(m => m.DeliveryPriceDetailComponent),
        title: 'Reco | Delivery Price Detail'
      },
      {
        path: 'users',
        loadComponent: () => import('@features/admin/users/users.component').then(m => m.UsersComponent),
        title: 'Reco | Users'
      },
      {
        path: 'users/new',
        loadComponent: () => import('@features/admin/users/user-detail/user-detail.component').then(m => m.UserDetailComponent),
        title: 'Reco | New User'
      },
      {
        path: 'users/:id',
        loadComponent: () => import('@features/admin/users/user-detail/user-detail.component').then(m => m.UserDetailComponent),
        title: 'Reco | User Detail'
      },
      {
        path: 'fuel-surcharges',
        loadComponent: () => import('@features/admin/fuel-surcharges/fuel-surcharges.component').then(m => m.FuelSurchargesComponent),
        title: 'Reco | Fuel Surcharges'
      },
      {
        path: 'fuel-surcharges/new',
        loadComponent: () => import('@features/admin/fuel-surcharges/fuel-surcharge-detail/fuel-surcharge-detail.component').then(m => m.FuelSurchargeDetailComponent),
        title: 'Reco | New Fuel Surcharge'
      },
      {
        path: 'fuel-surcharges/:id',
        loadComponent: () => import('@features/admin/fuel-surcharges/fuel-surcharge-detail/fuel-surcharge-detail.component').then(m => m.FuelSurchargeDetailComponent),
        title: 'Reco | Fuel Surcharge Detail'
      },
      {
        path: 'packaging-prices',
        loadComponent: () => import('@features/admin/packaging-prices/packaging-prices.component').then(m => m.PackagingPricesComponent),
        title: 'Reco | Packaging Prices'
      },
      {
        path: 'packaging-prices/new',
        loadComponent: () => import('@features/admin/packaging-prices/packaging-price-detail/packaging-price-detail.component').then(m => m.PackagingPriceDetailComponent),
        title: 'Reco | New Packaging Price'
      },
      {
        path: 'packaging-prices/:id',
        loadComponent: () => import('@features/admin/packaging-prices/packaging-price-detail/packaging-price-detail.component').then(m => m.PackagingPriceDetailComponent),
        title: 'Reco | Packaging Price Detail'
      },
      {
        path: 'active-inquiries',
        loadComponent: () => import('@features/admin/active-inquiries/active-inquiries.component').then(m => m.ActiveInquiriesComponent),
        title: 'Reco | Active Inquiries'
      }
    ]
  },

  // ============================================================================
  // CUSTOMER ADMIN ROUTES
  // ============================================================================
  {
    path: 'customer-admin',
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: [USER_ROLES.CLIENT_ADMIN] },
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
      // Order/Inquiry detail
      {
        path: 'orders/:id',
        loadComponent: () => import('@features/customer-admin/orders/order-detail/order-detail.component').then(m => m.OrderDetailComponent),
        title: 'Reco | Order Detail'
      },
      // Machines
      {
        path: 'machines',
        loadComponent: () => import('@features/customer-admin/machines/machines.component').then(m => m.MachinesComponent),
        title: 'Reco | My Machines'
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
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: [USER_ROLES.CLIENT] },
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
            path: 'groups',
            loadComponent: () => import('@features/customer/shop/product-groups/product-groups.component').then(m => m.ProductGroupsComponent),
            title: 'Reco | Product Groups'
          },
          {
            path: 'groups/:groupId',
            loadComponent: () => import('@features/customer/shop/products-in-group/products-in-group.component').then(m => m.ProductsInGroupComponent),
            title: 'Reco | Products in Group'
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
      // My Inquiries
      {
        path: 'inquiries',
        children: [
          {
            path: '',
            redirectTo: 'active',
            pathMatch: 'full'
          },
          {
            path: 'active',
            loadComponent: () => import('@features/customer/inquiry/inquiry.component').then(m => m.InquiryComponent),
            data: { filter: 'active' },
            title: 'Reco | Active Inquiries'
          },
          {
            path: 'history',
            loadComponent: () => import('@features/customer/inquiry/inquiry.component').then(m => m.InquiryComponent),
            data: { filter: 'history' },
            title: 'Reco | Inquiry History'
          },
          {
            path: 'drafts',
            loadComponent: () => import('@features/customer/inquiry/inquiry.component').then(m => m.InquiryComponent),
            data: { filter: 'drafts' },
            title: 'Reco | Inquiry Drafts'
          }
        ]
      },
      // Order/Inquiry detail
      {
        path: 'inquiry/:id',
        loadComponent: () => import('@features/customer/inquiry/inquiry-detail/inquiry-detail.component').then(m => m.InquiryDetailComponent),
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
    path: 'inquiry',
    redirectTo: 'customer/inquiries',
    pathMatch: 'full'
  },
  {
    path: 'search',
    loadComponent: () => import('@features/customer/search/search.component').then(m => m.SearchComponent),
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: [USER_ROLES.CLIENT] },
    title: 'Reco | Search'
  },
  {
    path: 'status',
    loadComponent: () => import('@features/customer/status/status.component').then(m => m.StatusComponent),
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: [USER_ROLES.CLIENT] },
    title: 'Reco | Status & Notifications'
  },

  // ============================================================================
  // SHARED/UTILITY ROUTES
  // ============================================================================
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
  // WILDCARD - Redirect unknown routes to login
  // ============================================================================
  {
    path: '**',
    redirectTo: 'login'
  }
];
