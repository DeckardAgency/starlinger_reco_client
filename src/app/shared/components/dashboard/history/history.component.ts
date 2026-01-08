import { Component, ChangeDetectionStrategy, ViewChild, TemplateRef, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SectionHeaderComponent, TabsComponent, BadgeComponent, AvatarComponent, ButtonComponent, DropdownMenuComponent, DropdownMenuItem } from '@app/ui-kit';
import { DataTableComponent, TableColumn, SortEvent } from '@app/ui-kit/organisms';

export type HistoryStatus = 'completed' | 'cancelled' | 'in-review';
export type HistoryType = 'order' | 'manual';

export interface HistoryItem {
  inquiryId: string;
  type: HistoryType;
  dateCreated: string;
  internalReference: string;
  customerInitials: string;
  customerName: string;
  partsOrdered: number;
  status: HistoryStatus;
}

@Component({
  selector: 'app-history',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    SectionHeaderComponent,
    TabsComponent,
    DataTableComponent,
    BadgeComponent,
    AvatarComponent,
    ButtonComponent,
    DropdownMenuComponent
  ],
  templateUrl: './history.component.html',
  styleUrls: ['./history.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HistoryComponent {
  @ViewChild('typeCell', { static: true }) typeCell!: TemplateRef<any>;
  @ViewChild('customerCell', { static: true }) customerCell!: TemplateRef<any>;
  @ViewChild('statusCell', { static: true }) statusCell!: TemplateRef<any>;
  @ViewChild('actionsCell', { static: true }) actionsCell!: TemplateRef<any>;

  activeTab = signal('latest');
  sortColumn = signal<string | null>('dateCreated');
  sortDirection = signal<'asc' | 'desc' | null>('desc');
  openMenuRowId = signal<string | null>(null);

  tabs = [
    { id: 'latest', label: 'Latest' },
    { id: 'completed', label: 'Completed' },
    { id: 'cancelled', label: 'Cancelled' }
  ];

  historyIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
    <path d="M11.6667 1.66675V5.00008C11.6667 5.44211 11.8423 5.86603 12.1548 6.17859C12.4674 6.49115 12.8913 6.66675 13.3333 6.66675H16.6667M7.5 12.5001L9.16667 14.1667L12.5 10.8334M12.5 1.66675H5C4.55798 1.66675 4.13405 1.84234 3.82149 2.1549C3.50893 2.46746 3.33334 2.89139 3.33334 3.33341V16.6667C3.33334 17.1088 3.50893 17.5327 3.82149 17.8453C4.13405 18.1578 4.55798 18.3334 5 18.3334H15C15.442 18.3334 15.866 18.1578 16.1785 17.8453C16.4911 17.5327 16.6667 17.1088 16.6667 16.6667V5.83341L12.5 1.66675Z" stroke="#232323" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`;

  columns = signal<TableColumn[]>([]);

  allData: HistoryItem[] = [
    {
      inquiryId: '0001',
      type: 'order',
      dateCreated: '14-03-2024',
      internalReference: '000123-ABC',
      customerInitials: 'AK',
      customerName: 'Anes Kapetanovic',
      partsOrdered: 12,
      status: 'completed'
    },
    {
      inquiryId: '0002',
      type: 'order',
      dateCreated: '14-03-2024',
      internalReference: '000987-EAD',
      customerInitials: 'AK',
      customerName: 'Anes Kapetanovic',
      partsOrdered: 192,
      status: 'cancelled'
    },
    {
      inquiryId: '0003',
      type: 'manual',
      dateCreated: '14-03-2024',
      internalReference: '004231-UGR',
      customerInitials: 'ME',
      customerName: 'Martin Ertl',
      partsOrdered: 48,
      status: 'completed'
    },
    {
      inquiryId: '0004',
      type: 'manual',
      dateCreated: '14-03-2024',
      internalReference: '001456-ZXY',
      customerInitials: 'Me',
      customerName: 'Martin Ertl',
      partsOrdered: 36,
      status: 'completed'
    },
    {
      inquiryId: '0005',
      type: 'order',
      dateCreated: '14-03-2024',
      internalReference: '002789-WPQ',
      customerInitials: 'AK',
      customerName: 'Anes Kapetanovic',
      partsOrdered: 24,
      status: 'cancelled'
    },
    {
      inquiryId: '0006',
      type: 'manual',
      dateCreated: '14-03-2024',
      internalReference: '005678-MNB',
      customerInitials: 'AK',
      customerName: 'Anes Kapetanovic',
      partsOrdered: 60,
      status: 'completed'
    },
    {
      inquiryId: '0007',
      type: 'order',
      dateCreated: '14-03-2024',
      internalReference: '003234-LJK',
      customerInitials: 'IJ',
      customerName: 'Ivan Jozic',
      partsOrdered: 72,
      status: 'completed'
    }
  ];

  ngAfterViewInit(): void {
    this.columns.set([
      { key: 'inquiryId', label: 'Inquiry ID' },
      { key: 'type', label: 'Type', template: this.typeCell },
      { key: 'dateCreated', label: 'Date Created', sortable: true },
      { key: 'internalReference', label: 'Internal reference number' },
      { key: 'customer', label: 'Customer', template: this.customerCell },
      { key: 'partsOrdered', label: 'Parts ordered' },
      { key: 'status', label: 'Status', template: this.statusCell },
      { key: 'actions', label: '', template: this.actionsCell }
    ]);
  }

  get filteredData(): HistoryItem[] {
    const tab = this.activeTab();
    if (tab === 'completed') {
      return this.allData.filter(item => item.status === 'completed');
    } else if (tab === 'cancelled') {
      return this.allData.filter(item => item.status === 'cancelled');
    }
    return this.allData;
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
    },
    {
      id: 'delete',
      label: 'Delete',
      icon: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M2 4H3.33333H14" stroke="#232323" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M12.6667 4.00008V13.3334C12.6667 13.6871 12.5262 14.0262 12.2762 14.2762C12.0261 14.5263 11.687 14.6667 11.3334 14.6667H4.66671C4.31309 14.6667 3.97395 14.5263 3.7239 14.2762C3.47385 14.0262 3.33337 13.6871 3.33337 13.3334V4.00008M5.33337 4.00008V2.66675C5.33337 2.31313 5.47385 1.97399 5.7239 1.72394C5.97395 1.47389 6.31309 1.33341 6.66671 1.33341H9.33337C9.68699 1.33341 10.0261 1.47389 10.2762 1.72394C10.5262 1.97399 10.6667 2.31313 10.6667 2.66675V4.00008" stroke="#232323" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M6.66663 7.33325V11.3333" stroke="#232323" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M9.33337 7.33325V11.3333" stroke="#232323" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"/>
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
    // Handle actions here
    switch (itemId) {
      case 'view':
        // Navigate to view page or show details
        break;
      case 'archive':
        // Archive the item
        break;
      case 'delete':
        // Delete the item
        break;
    }
  }
}
