import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { SidebarService } from '@services/sidebar.service';
import { CartService } from '@core/services/cart.service';
import { AuthService } from '@core/auth/auth.service';
import { NotificationComponent } from "@shared/components/notification/notification.component";
import { AlertComponent } from "@shared/components/alert/alert.component";
import { TopBarComponent } from "./topbar/top-bar.component";
import { SidebarComponent } from "./sidebar/sidebar.component";
import { MobileMenuComponent } from "./mobile-menu/mobile-menu.component";
import { CartComponent } from "@features/customer/shop/cart/cart.component";

@Component({
    selector: 'app-main-layout',
    imports: [
        CommonModule,
        RouterOutlet,
        SidebarComponent,
        TopBarComponent,
        NotificationComponent,
        AlertComponent,
        MobileMenuComponent,
        CartComponent
    ],
    template: `
    <div class="app">
        <app-top-bar></app-top-bar>
        <app-sidebar></app-sidebar>
        <app-mobile-menu></app-mobile-menu>
        <main class="app__main" [class.app__main--collapsed]="sidebarService.isCollapsed()">
        <router-outlet></router-outlet>
        </main>
        <app-notification></app-notification>
        <app-alert></app-alert>
        
        <!-- Cart Popup (Customer only) -->
        @if (isCustomer && cartService.isCartOpen()) {
          <app-cart (close)="cartService.closeCart()"></app-cart>
        }
    </div>
  `,
    styleUrls: ['./main-layout.component.scss']
})
export class MainLayoutComponent {
    sidebarService = inject(SidebarService);
    cartService = inject(CartService);
    private authService = inject(AuthService);

    get isCustomer(): boolean {
        // Client agents shop on behalf of managed clients, so they get the cart UI too.
        return this.authService.hasRole('ROLE_CLIENT')
            || this.authService.hasRole('ROLE_USER_CLIENT_AGENT');
    }
}
