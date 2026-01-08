import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { OrderCardComponent, OrderCardData } from '@app/ui-kit';

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

  // Mock data for active orders
  activeOrders: OrderCardData[] = [
    {
      id: '#0001',
      type: 'order',
      internalReference: '000123-ABC',
      dateCreated: '14-03-2024',
      partsOrdered: 12,
      status: 'submitted'
    },
    {
      id: '#0002',
      type: 'order',
      internalReference: '000987-EAD',
      dateCreated: '14-03-2024',
      partsOrdered: 12,
      status: 'confirmed'
    },
    {
      id: '#0003',
      type: 'inquiry',
      internalReference: '004231-UGR',
      dateCreated: '14-03-2024',
      partsOrdered: 12,
      status: 'in-review'
    },
    {
      id: '#0004',
      type: 'inquiry',
      internalReference: '000987-EAD',
      dateCreated: '14-03-2024',
      partsOrdered: 12,
      status: 'more-info'
    },
    {
      id: '#0005',
      type: 'order',
      internalReference: '000123-ABC',
      dateCreated: '14-03-2024',
      partsOrdered: 12,
      status: 'submitted'
    },
    {
      id: '#0006',
      type: 'order',
      internalReference: '004231-UGR',
      dateCreated: '14-03-2024',
      partsOrdered: 12,
      status: 'dispatched'
    },
    {
      id: '#0007',
      type: 'inquiry',
      internalReference: '000987-EAD',
      dateCreated: '14-03-2024',
      partsOrdered: 12,
      status: 'in-progress'
    }
  ];

  // Mock data for history
  historyOrders: OrderCardData[] = [
    {
      id: '#0008',
      type: 'order',
      internalReference: '000555-XYZ',
      dateCreated: '10-02-2024',
      partsOrdered: 8,
      status: 'completed'
    },
    {
      id: '#0009',
      type: 'inquiry',
      internalReference: '000666-ABC',
      dateCreated: '05-02-2024',
      partsOrdered: 15,
      status: 'completed'
    },
    {
      id: '#0010',
      type: 'order',
      internalReference: '000777-DEF',
      dateCreated: '01-02-2024',
      partsOrdered: 6,
      status: 'cancelled'
    }
  ];

  // Mock data for drafts
  draftOrders: OrderCardData[] = [
    {
      id: '#0011',
      type: 'inquiry',
      internalReference: '000888-GHI',
      dateCreated: '20-03-2024',
      partsOrdered: 3,
      status: 'draft'
    },
    {
      id: '#0012',
      type: 'order',
      internalReference: '000999-JKL',
      dateCreated: '18-03-2024',
      partsOrdered: 20,
      status: 'draft'
    }
  ];

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
