import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { OrderCardComponent, OrderCardData } from '@app/ui-kit';

@Component({
  selector: 'app-active-inquiries',
  standalone: true,
  imports: [CommonModule, RouterModule, OrderCardComponent],
  templateUrl: './active-inquiries.component.html',
  styleUrls: ['./active-inquiries.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ActiveInquiriesComponent {
  isLoading = false;

  // Initialize data directly - no async loading
  orders: OrderCardData[] = [
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
      status: 'submitted'
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

  get totalCount(): number {
    return this.orders.length;
  }
}

