import { Component, ChangeDetectionStrategy, ViewChild, TemplateRef, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SectionHeaderComponent, TabsComponent, BadgeComponent, AvatarComponent, TableActionsDropdownComponent, TableAction, ActionClickEvent } from '@app/ui-kit';
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
    TableActionsDropdownComponent
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

  tableActions: TableAction[] = [
    { id: 'view', label: 'View', icon: 'eye' },
    { id: 'archive', label: 'Archive', icon: 'archive' },
    { id: 'delete', label: 'Delete', icon: 'trash', variant: 'danger' }
  ];

  toggleMenu(rowId: string): void {
    this.openMenuRowId.set(this.openMenuRowId() === rowId ? null : rowId);
  }

  closeMenu(): void {
    this.openMenuRowId.set(null);
  }

  onActionClick(event: ActionClickEvent): void {
    const row = event.row as HistoryItem;
    console.log(`Action ${event.actionId} for row:`, row);
    // Handle actions here
    switch (event.actionId) {
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
