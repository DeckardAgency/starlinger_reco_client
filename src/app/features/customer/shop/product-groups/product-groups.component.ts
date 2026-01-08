import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { BreadcrumbsComponent, BreadcrumbItem } from '@app/ui-kit/molecules/breadcrumbs/breadcrumbs.component';
import { mockProductGroupsExtended, ProductGroupExtended } from '@core/mocks/mock-data';

@Component({
  selector: 'app-product-groups',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    BreadcrumbsComponent
  ],
  templateUrl: './product-groups.component.html',
  styleUrls: ['./product-groups.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProductGroupsComponent {
  // Data from mock
  productGroups = signal<ProductGroupExtended[]>(mockProductGroupsExtended);

  // Breadcrumb
  breadcrumbItems: BreadcrumbItem[] = [
    { label: 'Shop', route: '/customer/shop' },
    { label: 'Product groups' }
  ];

  constructor(private router: Router) {}

  viewGroup(groupId: string): void {
    this.router.navigate(['/customer/shop/groups', groupId]);
  }

  trackByGroupId(index: number, group: ProductGroupExtended): string {
    return group.id;
  }
}


