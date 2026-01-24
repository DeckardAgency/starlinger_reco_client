import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { OrderCardComponent, OrderCardData } from '@app/ui-kit';
import {
  mockCustomerInquiryActiveOrders,
  mockCustomerInquiryHistoryOrders,
  mockCustomerInquiryDraftOrders
} from '@core/mocks/mock-data';

@Component({
    selector: 'app-inquiry',
    standalone: true,
  imports: [CommonModule, RouterModule, OrderCardComponent],
  templateUrl: './inquiry.component.html',
  styleUrls: ['./inquiry.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class InquiryComponent {
  isLoading = false;
  filter: 'active' | 'history' | 'drafts' = 'active';

  // Mock data from central store
  activeOrders: OrderCardData[] = mockCustomerInquiryActiveOrders;
  historyOrders: OrderCardData[] = mockCustomerInquiryHistoryOrders;
  draftOrders: OrderCardData[] = mockCustomerInquiryDraftOrders;

  constructor(private route: ActivatedRoute) {
    this.route.data.subscribe(data => {
      this.filter = data['filter'] || 'active';
    });
  }

  get orders(): OrderCardData[] {
    switch (this.filter) {
      case 'history':
        return this.historyOrders;
      case 'drafts':
        return this.draftOrders;
      default:
        return this.activeOrders;
    }
  }

  get totalCount(): number {
    return this.orders.length;
  }

  get pageTitle(): string {
    switch (this.filter) {
      case 'history':
        return 'History';
      case 'drafts':
        return 'Drafts';
      default:
        return 'Active orders';
            }
        }

  get breadcrumbTitle(): string {
    switch (this.filter) {
      case 'history':
        return 'History';
      case 'drafts':
        return 'Drafts';
      default:
        return 'Active';
    }
  }
}
