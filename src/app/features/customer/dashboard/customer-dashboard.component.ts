import { Component, ChangeDetectionStrategy, ViewChild, TemplateRef, signal, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import {
  SectionHeaderComponent,
  QuickActionCardComponent,
  QuickActionCardData,
  QuickActionType,
  OrderCardComponent,
  OrderCardData,
  TabsComponent,
  BadgeComponent,
  ButtonComponent,
  DropdownMenuComponent,
  DropdownMenuItem
} from '@app/ui-kit';
import { DataTableComponent, TableColumn, SortEvent } from '@app/ui-kit/organisms';

// Contact form model
interface ContactFormData {
  subject: string;
  message: string;
  orderInquiryId: string;
  machineProduct: string;
  attachment: File | null;
  urgency: string;
}

export type HistoryStatus = 'completed' | 'cancelled' | 'in-review';
export type HistoryType = 'order' | 'manual';

export interface HistoryItem {
  inquiryId: string;
  type: HistoryType;
  dateCreated: string;
  internalReference: string;
  partsOrdered: number;
  status: HistoryStatus;
}

@Component({
    selector: 'app-customer-dashboard',
    standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    SectionHeaderComponent,
    QuickActionCardComponent,
    OrderCardComponent,
    TabsComponent,
    DataTableComponent,
    BadgeComponent,
    ButtonComponent,
    DropdownMenuComponent
  ],
  templateUrl: './customer-dashboard.component.html',
  styleUrls: ['./customer-dashboard.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CustomerDashboardComponent implements AfterViewInit {
  @ViewChild('typeCell', { static: true }) typeCell!: TemplateRef<any>;
  @ViewChild('statusCell', { static: true }) statusCell!: TemplateRef<any>;
  @ViewChild('actionsCell', { static: true }) actionsCell!: TemplateRef<any>;

  // Quick Actions section
  quickActionsIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
    <path d="M11.6667 1.66675L3.33334 11.6667H10L8.33334 18.3334L16.6667 8.33341H10L11.6667 1.66675Z" stroke="#232323" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`;

  quickActions: QuickActionCardData[] = [
    {
      type: 'new-order',
      title: 'New order',
      description: 'Initiate a spare part request by completing our custom tailored ordering solutions.',
      buttonLabel: 'Create',
      routerLink: '/customer/shop'
    },
    {
      type: 'contact-sales',
      title: 'Contact Sales Manager',
      description: 'Access direct communication channel for expert support, technical consultations and inquiry status.',
      buttonLabel: 'Contact'
      // No routerLink - will trigger buttonClick event
    }
  ];

  // Contact Modal state
  showContactModal = signal(false);
  contactFormData: ContactFormData = {
    subject: '',
    message: '',
    orderInquiryId: '',
    machineProduct: '',
    attachment: null,
    urgency: ''
  };
  selectedFileName = signal<string>('');

  // Active Orders section
  activeOrdersIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
    <path d="M10 7.50008V10.8334M10 14.1667H10.0083M12.5 1.66675H5C4.55798 1.66675 4.13405 1.84234 3.82149 2.1549C3.50893 2.46746 3.33334 2.89139 3.33334 3.33341V16.6667C3.33334 17.1088 3.50893 17.5327 3.82149 17.8453C4.13405 18.1578 4.55798 18.3334 5 18.3334H15C15.442 18.3334 15.866 18.1578 16.1785 17.8453C16.4911 17.5327 16.6667 17.1088 16.6667 16.6667V5.83341L12.5 1.66675Z" stroke="#232323" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`;

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
    }
  ];

  // History section
  historyIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
    <path d="M11.6667 1.66675V5.00008C11.6667 5.44211 11.8423 5.86603 12.1548 6.17859C12.4674 6.49115 12.8913 6.66675 13.3333 6.66675H16.6667M7.5 12.5001L9.16667 14.1667L12.5 10.8334M12.5 1.66675H5C4.55798 1.66675 4.13405 1.84234 3.82149 2.1549C3.50893 2.46746 3.33334 2.89139 3.33334 3.33341V16.6667C3.33334 17.1088 3.50893 17.5327 3.82149 17.8453C4.13405 18.1578 4.55798 18.3334 5 18.3334H15C15.442 18.3334 15.866 18.1578 16.1785 17.8453C16.4911 17.5327 16.6667 17.1088 16.6667 16.6667V5.83341L12.5 1.66675Z" stroke="#232323" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`;

  activeTab = signal('latest');
  sortColumn = signal<string | null>('dateCreated');
  sortDirection = signal<'asc' | 'desc' | null>('desc');
  openMenuRowId = signal<string | null>(null);

  tabs = [
    { id: 'latest', label: 'Latest' },
    { id: 'completed', label: 'Completed' },
    { id: 'cancelled', label: 'Cancelled' }
  ];

  columns = signal<TableColumn[]>([]);

  historyData: HistoryItem[] = [
    {
      inquiryId: '0001',
      type: 'order',
      dateCreated: '14-03-2024',
      internalReference: '000123-ABC',
      partsOrdered: 12,
      status: 'completed'
    },
    {
      inquiryId: '0002',
      type: 'order',
      dateCreated: '14-03-2024',
      internalReference: '000987-EAD',
      partsOrdered: 192,
      status: 'cancelled'
    },
    {
      inquiryId: '0003',
      type: 'manual',
      dateCreated: '14-03-2024',
      internalReference: '004231-UGR',
      partsOrdered: 48,
      status: 'completed'
    },
    {
      inquiryId: '0004',
      type: 'manual',
      dateCreated: '14-03-2024',
      internalReference: '001456-ZXY',
      partsOrdered: 36,
      status: 'completed'
    },
    {
      inquiryId: '0005',
      type: 'order',
      dateCreated: '14-03-2024',
      internalReference: '002789-WPQ',
      partsOrdered: 24,
      status: 'cancelled'
    },
    {
      inquiryId: '0006',
      type: 'manual',
      dateCreated: '14-03-2024',
      internalReference: '005678-MNB',
      partsOrdered: 60,
      status: 'completed'
    },
    {
      inquiryId: '0007',
      type: 'order',
      dateCreated: '14-03-2024',
      internalReference: '003234-LJK',
      partsOrdered: 72,
      status: 'completed'
    }
  ];

  ngAfterViewInit(): void {
    // Set columns without Customer column for Customer view
    this.columns.set([
      { key: 'inquiryId', label: 'Inquiry ID' },
      { key: 'type', label: 'Type', template: this.typeCell },
      { key: 'dateCreated', label: 'Date Created', sortable: true },
      { key: 'internalReference', label: 'Internal reference number' },
      { key: 'partsOrdered', label: 'Parts ordered' },
      { key: 'status', label: 'Status', template: this.statusCell },
      { key: 'actions', label: '', template: this.actionsCell }
    ]);
  }

  get filteredData(): HistoryItem[] {
    const tab = this.activeTab();
    if (tab === 'completed') {
      return this.historyData.filter(item => item.status === 'completed');
    } else if (tab === 'cancelled') {
      return this.historyData.filter(item => item.status === 'cancelled');
    }
    return this.historyData;
  }

  onTabChange(tabId: string): void {
    this.activeTab.set(tabId);
  }

  onSort(event: SortEvent): void {
    this.sortColumn.set(event.column);
    this.sortDirection.set(event.direction);
  }

  getTypeBadgeVariant(type: HistoryType): 'success' | 'info' {
    return type === 'order' ? 'success' : 'info';
  }

  getTypeLabel(type: HistoryType): string {
    return type === 'order' ? 'Order' : 'Manual';
  }

  getStatusBadgeVariant(status: HistoryStatus): 'success' | 'danger' | 'warning' {
    const variants: Record<HistoryStatus, 'success' | 'danger' | 'warning'> = {
      'completed': 'success',
      'cancelled': 'danger',
      'in-review': 'warning'
    };
    return variants[status];
            }

  getStatusLabel(status: HistoryStatus): string {
    const labels: Record<HistoryStatus, string> = {
      'completed': 'Completed',
      'cancelled': 'Cancelled',
      'in-review': 'In review'
    };
    return labels[status];
  }

  dropdownMenuItems: DropdownMenuItem[] = [
    {
      id: 'view',
      label: 'View',
      icon: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M0.666687 8.00008C0.666687 8.00008 3.33335 2.66675 8.00002 2.66675C12.6667 2.66675 15.3334 8.00008 15.3334 8.00008C15.3334 8.00008 12.6667 13.3334 8.00002 13.3334C3.33335 13.3334 0.666687 8.00008 0.666687 8.00008Z" stroke="#232323" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M8 10C9.10457 10 10 9.10457 10 8C10 6.89543 9.10457 6 8 6C6.89543 6 6 6.89543 6 8C6 9.10457 6.89543 10 8 10Z" stroke="#232323" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>`
    },
    {
      id: 'archive',
      label: 'Archive',
      icon: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M14 5.33325V13.9999C14 14.3535 13.8595 14.6927 13.6095 14.9427C13.3594 15.1928 13.0203 15.3333 12.6667 15.3333H3.33333C2.97971 15.3333 2.64057 15.1928 2.39052 14.9427C2.14048 14.6927 2 14.3535 2 13.9999V5.33325M6 7.99992H10M0.666667 2.66659H15.3333V5.33325H0.666667V2.66659Z" stroke="#232323" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>`
    }
  ];

  toggleMenu(rowId: string): void {
    this.openMenuRowId.set(this.openMenuRowId() === rowId ? null : rowId);
  }

  closeMenu(): void {
    this.openMenuRowId.set(null);
  }

  onMenuItemClick(itemId: string, row: HistoryItem): void {
    console.log(`Action ${itemId} for row:`, row);
    switch (itemId) {
      case 'view':
        // Navigate to detail page
        break;
      case 'archive':
        // Archive the item
        break;
            }
        }

  // Quick Action handlers
  onQuickActionClick(type: QuickActionType): void {
    if (type === 'contact-sales') {
      this.openContactModal();
    }
  }

  // Contact Modal methods
  openContactModal(): void {
    this.resetContactForm();
    this.showContactModal.set(true);
  }

  closeContactModal(): void {
    this.showContactModal.set(false);
    this.resetContactForm();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.contactFormData.attachment = input.files[0];
      this.selectedFileName.set(input.files[0].name);
    }
  }

  onSendMessage(): void {
    console.log('Sending message:', this.contactFormData);
    // Here you would typically send the data to an API
    this.closeContactModal();
  }

  private resetContactForm(): void {
    this.contactFormData = {
      subject: '',
      message: '',
      orderInquiryId: '',
      machineProduct: '',
      attachment: null,
      urgency: ''
    };
    this.selectedFileName.set('');
  }
}
