import { Component, ChangeDetectionStrategy, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { BreadcrumbsComponent, BreadcrumbItem } from '@app/ui-kit/molecules/breadcrumbs/breadcrumbs.component';
import { IconComponent } from '@app/ui-kit/atoms/icon/icon.component';
import { ProductGroupService } from '@core/services/http/product-group.service';
import { ProductGroup } from '@core/models';

// UI interface for displaying product groups
interface ProductGroupDisplay {
  id: string;
  name: string;
  totalProducts: number;
  imageUrl?: string;
  slug: string;
}

@Component({
  selector: 'app-product-groups',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    BreadcrumbsComponent,
    IconComponent
  ],
  templateUrl: './product-groups.component.html',
  styleUrls: ['./product-groups.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProductGroupsComponent implements OnInit {
  private productGroupService = inject(ProductGroupService);
  private router = inject(Router);

  // Data loaded from API
  productGroups = signal<ProductGroupDisplay[]>([]);
  isLoading = signal(true);

  // Breadcrumb
  breadcrumbItems: BreadcrumbItem[] = [
    { label: 'Shop', route: '/customer/shop' },
    { label: 'Product groups' }
  ];

  ngOnInit(): void {
    this.loadProductGroups();
  }

  private loadProductGroups(): void {
    this.isLoading.set(true);
    this.productGroupService.getProductGroups().subscribe({
      next: (response) => {
        const groups = response.member.map(group => this.mapToDisplayGroup(group));
        this.productGroups.set(groups);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Failed to load product groups:', error);
        this.isLoading.set(false);
      }
    });
  }

  private mapToDisplayGroup(group: ProductGroup): ProductGroupDisplay {
    return {
      id: group.id,
      name: group.name,
      totalProducts: group.totalProducts,
      imageUrl: group.featuredImage || undefined,
      slug: group.slug
    };
  }

  viewGroup(groupId: string): void {
    this.router.navigate(['/customer/shop/groups', groupId]);
  }

  trackByGroupId(index: number, group: ProductGroupDisplay): string {
    return group.id;
  }
}
