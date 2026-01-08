import { Component, ChangeDetectionStrategy, ChangeDetectorRef, signal, computed, ViewChild, TemplateRef, AfterViewInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';

import { DataTableComponent, TableColumn, SortEvent } from '@app/ui-kit/organisms/data-table/data-table.component';
import { BadgeComponent } from '@app/ui-kit/atoms/badge/badge.component';
import { AvatarComponent } from '@app/ui-kit/atoms/avatar/avatar.component';
import { TabsComponent, TabItem } from '@app/ui-kit/molecules/tabs/tabs.component';

interface ManualEntry {
  id: string;
  type: 'inquiry';
  dateCreated: string;
  internalRef: string;
  customer: {
    name: string;
    initials: string;
    avatar?: string;
  };
  partsOrdered: number;
  status: 'completed' | 'cancelled' | 'archived' | 'rejected';
}

@Component({
  selector: 'app-manual-entries',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    DataTableComponent,
    BadgeComponent,
    AvatarComponent,
    TabsComponent
  ],
  templateUrl: './manual-entries.component.html',
  styleUrls: ['./manual-entries.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ManualEntriesComponent implements AfterViewInit {
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  @ViewChild('typeTemplate') typeTemplate!: TemplateRef<any>;
  @ViewChild('customerTemplate') customerTemplate!: TemplateRef<any>;
  @ViewChild('statusTemplate') statusTemplate!: TemplateRef<any>;
  @ViewChild('actionsTemplate') actionsTemplate!: TemplateRef<any>;

  // Search state
  searchQuery = '';

  // Loading state
  isLoading = signal(false);

  // Sort state
  sortColumn: string | null = null;
  sortDirection: 'asc' | 'desc' | null = null;

  // Dropdown state
  openDropdownId = signal<string | null>(null);

  // Active tab
  activeTab = signal('latest');

  // Tabs configuration
  tabs: TabItem[] = [
    { id: 'latest', label: 'Latest' },
    { id: 'completed', label: 'Completed' },
    { id: 'cancelled', label: 'Cancelled' }
  ];

  // Table columns
  columns: TableColumn[] = [];

  // Mock data
  allEntries = signal<ManualEntry[]>([
    { id: '0001', type: 'inquiry', dateCreated: '14-03-2024', internalRef: '000123-ABC', customer: { name: 'Anes Kapetanovic', initials: 'AK' }, partsOrdered: 12, status: 'completed' },
    { id: '0002', type: 'inquiry', dateCreated: '14-03-2024', internalRef: '000987-EAD', customer: { name: 'Anes Kapetanovic', initials: 'AK' }, partsOrdered: 192, status: 'completed' },
    { id: '0003', type: 'inquiry', dateCreated: '14-03-2024', internalRef: '004231-UGR', customer: { name: 'Martin Ertl', initials: 'ME' }, partsOrdered: 48, status: 'archived' },
    { id: '0004', type: 'inquiry', dateCreated: '14-03-2024', internalRef: '001456-ZXY', customer: { name: 'Martin Ertl', initials: 'ME' }, partsOrdered: 36, status: 'rejected' },
    { id: '0005', type: 'inquiry', dateCreated: '14-03-2024', internalRef: '002789-WPQ', customer: { name: 'Anes Kapetanovic', initials: 'AK', avatar: 'assets/avatars/anes.jpg' }, partsOrdered: 24, status: 'cancelled' },
    { id: '0006', type: 'inquiry', dateCreated: '14-03-2024', internalRef: '005678-MNB', customer: { name: 'Anes Kapetanovic', initials: 'AK' }, partsOrdered: 60, status: 'completed' },
    { id: '0007', type: 'inquiry', dateCreated: '14-03-2024', internalRef: '003234-LJK', customer: { name: 'Ivan Jozic', initials: 'IJ' }, partsOrdered: 72, status: 'completed' },
    { id: '0008', type: 'inquiry', dateCreated: '14-03-2024', internalRef: '007890-QWE', customer: { name: 'Mira Kulic', initials: 'MK' }, partsOrdered: 15, status: 'completed' },
    { id: '0009', type: 'inquiry', dateCreated: '14-03-2024', internalRef: '009876-RYT', customer: { name: 'Sofia Lichtenstein', initials: 'SL' }, partsOrdered: 84, status: 'completed' },
    { id: '0010', type: 'inquiry', dateCreated: '14-03-2024', internalRef: '006543-PLM', customer: { name: 'Tommy Barlow', initials: 'TB' }, partsOrdered: 30, status: 'archived' },
    { id: '0011', type: 'inquiry', dateCreated: '14-03-2024', internalRef: '008765-VBN', customer: { name: 'Yara Nasr', initials: 'YN' }, partsOrdered: 99, status: 'rejected' },
    { id: '0012', type: 'inquiry', dateCreated: '14-03-2024', internalRef: '010101-XYZ', customer: { name: 'Diana Patel', initials: 'DP' }, partsOrdered: 57, status: 'completed' },
    { id: '0013', type: 'inquiry', dateCreated: '14-03-2024', internalRef: '011213-ABC', customer: { name: 'Roger Lee', initials: 'RL' }, partsOrdered: 81, status: 'completed' },
    { id: '0014', type: 'inquiry', dateCreated: '14-03-2024', internalRef: '012345-DEF', customer: { name: 'Sara Wong', initials: 'SW' }, partsOrdered: 40, status: 'archived' },
    { id: '0015', type: 'inquiry', dateCreated: '14-03-2024', internalRef: '013456-GHI', customer: { name: 'Jack Monroe', initials: 'JM' }, partsOrdered: 22, status: 'rejected' },
    { id: '0016', type: 'inquiry', dateCreated: '14-03-2024', internalRef: '014567-JKL', customer: { name: 'Clara Thompson', initials: 'CT' }, partsOrdered: 66, status: 'cancelled' },
    { id: '0017', type: 'inquiry', dateCreated: '14-03-2024', internalRef: '015678-MNO', customer: { name: 'Zara Nguyen', initials: 'ZN' }, partsOrdered: 3, status: 'completed' }
  ]);

  // Filtered entries based on active tab
  entries = computed(() => {
    const tab = this.activeTab();
    const all = this.allEntries();
    
    if (tab === 'completed') {
      return all.filter(e => e.status === 'completed');
    } else if (tab === 'cancelled') {
      return all.filter(e => e.status === 'cancelled');
    }
    // 'latest' shows all
    return all;
  });

  // Total count
  totalCount = computed(() => this.allEntries().length);

  ngAfterViewInit(): void {
    this.initColumns();
    this.cdr.detectChanges();
  }

  private initColumns(): void {
    this.columns = [
      { key: 'id', label: 'Order ID', sortable: true, width: '112px' },
      { key: 'type', label: 'Type', sortable: false, width: '128px', template: this.typeTemplate },
      { key: 'dateCreated', label: 'Date Created', sortable: true, width: '190px' },
      { key: 'internalRef', label: 'Internal reference number', sortable: false },
      { key: 'customer', label: 'Customer', sortable: false, template: this.customerTemplate },
      { key: 'partsOrdered', label: 'Parts ordered', sortable: false, width: '128px' },
      { key: 'status', label: 'Status', sortable: false, width: '128px', template: this.statusTemplate },
      { key: 'actions', label: '', sortable: false, width: '64px', template: this.actionsTemplate }
    ];
  }

  onTabChange(tabId: string): void {
    this.activeTab.set(tabId);
  }

  onSearch(): void {
    console.log('Searching:', this.searchQuery);
  }

  onSortChange(event: SortEvent): void {
    this.sortColumn = event.column;
    this.sortDirection = event.direction;
    console.log('Sorting by:', event.column, event.direction);
  }

  onExport(): void {
    console.log('Exporting data...');
  }

  toggleDropdown(entryId: string, event: Event): void {
    event.stopPropagation();
    if (this.openDropdownId() === entryId) {
      this.openDropdownId.set(null);
    } else {
      this.openDropdownId.set(entryId);
    }
  }

  closeDropdown(): void {
    this.openDropdownId.set(null);
  }

  onView(entry: ManualEntry): void {
    console.log('View entry:', entry);
    this.router.navigate(['/admin/manual-entries', entry.id]);
    this.closeDropdown();
  }

  onDelete(entry: ManualEntry): void {
    console.log('Delete entry:', entry);
    this.closeDropdown();
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'completed': return 'Completed';
      case 'cancelled': return 'Cancelled';
      case 'archived': return 'Archived';
      case 'rejected': return 'Rejected';
      default: return status;
    }
  }

  getStatusVariant(status: string): 'success' | 'danger' | 'warning' | 'info' | 'secondary' {
    switch (status) {
      case 'completed': return 'success';
      case 'cancelled': return 'danger';
      case 'archived': return 'warning';
      case 'rejected': return 'info';
      default: return 'secondary';
    }
  }
}

