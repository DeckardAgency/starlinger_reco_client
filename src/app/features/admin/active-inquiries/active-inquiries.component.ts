import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { OrderCardComponent, OrderCardData, BreadcrumbsComponent, ListHeaderComponent } from '@app/ui-kit';
import { mockActiveInquiries } from '@core/mocks/mock-data';

@Component({
  selector: 'app-active-inquiries',
  standalone: true,
  imports: [CommonModule, RouterModule, OrderCardComponent, BreadcrumbsComponent, ListHeaderComponent],
  templateUrl: './active-inquiries.component.html',
  styleUrls: ['./active-inquiries.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ActiveInquiriesComponent {
  isLoading = false;

  // Data from centralized mock file
  orders: OrderCardData[] = mockActiveInquiries as OrderCardData[];

  get totalCount(): number {
    return this.orders.length;
  }
}
