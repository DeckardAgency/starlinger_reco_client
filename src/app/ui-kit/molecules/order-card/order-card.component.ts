import { Component, ChangeDetectionStrategy, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { BadgeComponent, ButtonComponent, BadgeVariant } from '@app/ui-kit/atoms';
import { CardComponent } from '../card/card.component';

export type OrderCardType = 'order';
export type OrderCardStatus =
  | 'draft'
  | 'new'
  | 'in-process'
  | 'waiting-for-payment'
  | 'ready-for-shipment'
  | 'shipped'
  | 'delivered'
  | 'canceled'
  | 'reversal';

export interface OrderCardData {
  id: string;
  orderId?: string; // Real UUID for routing
  type: OrderCardType;
  internalReference: string;
  dateCreated: string;
  partsOrdered: number;
  status: OrderCardStatus;
}

@Component({
  selector: 'ui-order-card',
  standalone: true,
  imports: [CommonModule, RouterModule, BadgeComponent, ButtonComponent, CardComponent],
  templateUrl: './order-card.component.html',
  styleUrls: ['./order-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OrderCardComponent {
  @Input({ required: true }) data!: OrderCardData;
  @Input() routePrefix: string = '/admin';

  getStatusLabel(status: OrderCardStatus): string {
    const labels: Record<OrderCardStatus, string> = {
      'draft': 'Draft',
      'new': 'New',
      'in-process': 'In Process',
      'waiting-for-payment': 'Waiting for Payment',
      'ready-for-shipment': 'Ready for Shipment',
      'shipped': 'Shipped',
      'delivered': 'Delivered',
      'canceled': 'Cancelled',
      'reversal': 'Reversal'
    };
    return labels[status] || status;
  }

  getStatusVariant(status: OrderCardStatus): BadgeVariant {
    const variants: Record<OrderCardStatus, BadgeVariant> = {
      'draft': 'secondary',
      'new': 'info',
      'in-process': 'warning',
      'waiting-for-payment': 'warning',
      'ready-for-shipment': 'info',
      'shipped': 'info',
      'delivered': 'success',
      'canceled': 'danger',
      'reversal': 'danger'
    };
    return variants[status] || 'secondary';
  }

  getDetailLink(): string {
    const id = this.data.orderId || this.data.id;
    return `${this.routePrefix}/orders/${id}`;
  }
}
