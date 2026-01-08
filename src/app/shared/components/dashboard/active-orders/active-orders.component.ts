import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { OrderCardComponent, OrderCardData, SectionHeaderComponent } from '@app/ui-kit';

@Component({
  selector: 'app-active-orders',
  imports: [CommonModule, RouterModule, OrderCardComponent, SectionHeaderComponent],
  templateUrl: './active-orders.component.html',
  styleUrls: ['./active-orders.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ActiveOrdersComponent {
  ordersIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
    <path d="M10 7.50008V10.8334M10 14.1667H10.0083M12.5 1.66675H5C4.55798 1.66675 4.13405 1.84234 3.82149 2.1549C3.50893 2.46746 3.33334 2.89139 3.33334 3.33341V16.6667C3.33334 17.1088 3.50893 17.5327 3.82149 17.8453C4.13405 18.1578 4.55798 18.3334 5 18.3334H15C15.442 18.3334 15.866 18.1578 16.1785 17.8453C16.4911 17.5327 16.6667 17.1088 16.6667 16.6667V5.83341L12.5 1.66675Z" stroke="#232323" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`;

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
    }
  ];
}
