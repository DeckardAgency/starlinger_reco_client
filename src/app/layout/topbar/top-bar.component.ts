import { Component, ChangeDetectionStrategy } from '@angular/core';
import { MobileMenuService } from '@services/mobile-menu.service';

@Component({
    selector: 'app-top-bar',
    imports: [],
    templateUrl: './top-bar.component.html',
    styleUrls: ['./top-bar.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class TopBarComponent {
  constructor(
    private mobileMenuService: MobileMenuService
  ) {}

  toggleMobileMenu(): void {
    this.mobileMenuService.toggle();
  }
}
