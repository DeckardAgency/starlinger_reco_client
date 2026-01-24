import { Component, ChangeDetectionStrategy, ChangeDetectorRef, signal, computed, OnInit, OnDestroy, inject, ViewChild, TemplateRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

import { ToggleComponent } from '@app/ui-kit/atoms/toggle/toggle.component';
import { TabsComponent, TabItem } from '@app/ui-kit/molecules/tabs/tabs.component';
import { BadgeComponent } from '@app/ui-kit/atoms/badge/badge.component';
import { IconComponent } from '@app/ui-kit/atoms/icon/icon.component';
import { AvatarComponent } from '@app/ui-kit/atoms/avatar/avatar.component';
import { FormFieldComponent } from '@app/ui-kit/molecules/form-field/form-field.component';
import { BreadcrumbsComponent } from '@app/ui-kit/molecules/breadcrumbs/breadcrumbs.component';
import { DetailHeaderComponent } from '@app/ui-kit/molecules/detail-header/detail-header.component';
import { TableFooterComponent } from '@app/ui-kit/molecules/table-footer/table-footer.component';
import { TableActionsDropdownComponent, TableAction, ActionClickEvent } from '@app/ui-kit/molecules/table-actions-dropdown/table-actions-dropdown.component';
import { DataTableComponent, TableColumn } from '@app/ui-kit/organisms/data-table/data-table.component';
import { MobileFooterComponent } from '@app/ui-kit/molecules/mobile-footer/mobile-footer.component';
import { Account, AccountContact } from '@core/models/account.model';

// Interfaces for tab data
interface Address {
  id: number;
  street: string;
  city: string;
  country: string;
  isBilling: boolean;
  isDelivery: boolean;
}

interface ShopOrder {
  orderId: string;
  type: 'order' | 'manual';
  dateCreated: string;
  internalRef: string;
  customer: {
    name: string;
    initials: string;
    avatar?: string;
  };
  partsOrdered: number;
  status: 'completed' | 'delayed' | 'failed' | 'in-review' | 'archived';
}

interface Machine {
  machineId: string;
  location: string;
  name: string;
}

// Default empty account for new mode
const EMPTY_ACCOUNT: Account = {
  id: 0,
  code: '',
  oib: '',
  name: '',
  email: '',
  status: 'active',
  purchaseLimit: 0,
  amountSpent: 0,
  isActive: true,
  isLegalEntity: false,
  accountType: [],
  phone: '',
  otherPhone: '',
  otherEmail: '',
  fax: '',
  web: ''
};

@Component({
  selector: 'app-account-detail',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    ToggleComponent,
    TabsComponent,
    BadgeComponent,
    IconComponent,
    AvatarComponent,
    FormFieldComponent,
    BreadcrumbsComponent,
    DetailHeaderComponent,
    TableFooterComponent,
    TableActionsDropdownComponent,
    DataTableComponent,
    MobileFooterComponent
  ],
  templateUrl: './account-detail.component.html',
  styleUrls: ['./account-detail.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AccountDetailComponent implements OnInit, OnDestroy, AfterViewInit {
  private cdr = inject(ChangeDetectorRef);
  private route = inject(ActivatedRoute);
  private destroy$ = new Subject<void>();

  // Template refs for custom cell rendering
  @ViewChild('contactBillingTemplate') contactBillingTemplate!: TemplateRef<any>;
  @ViewChild('contactActionsTemplate') contactActionsTemplate!: TemplateRef<any>;
  @ViewChild('addressBillingTemplate') addressBillingTemplate!: TemplateRef<any>;
  @ViewChild('addressDeliveryTemplate') addressDeliveryTemplate!: TemplateRef<any>;
  @ViewChild('addressActionsTemplate') addressActionsTemplate!: TemplateRef<any>;
  @ViewChild('orderTypeTemplate') orderTypeTemplate!: TemplateRef<any>;
  @ViewChild('orderCustomerTemplate') orderCustomerTemplate!: TemplateRef<any>;
  @ViewChild('orderStatusTemplate') orderStatusTemplate!: TemplateRef<any>;
  @ViewChild('orderActionsTemplate') orderActionsTemplate!: TemplateRef<any>;
  @ViewChild('machineActionsTemplate') machineActionsTemplate!: TemplateRef<any>;

  // Table column configs
  contactsColumns: TableColumn[] = [];
  addressesColumns: TableColumn[] = [];
  shopOrdersColumns: TableColumn[] = [];
  manualEntriesColumns: TableColumn[] = [];
  machinesColumns: TableColumn[] = [];

  // Mode tracking
  isEditMode = signal(false);

  // Account data - starts empty
  account = signal<Account>({ ...EMPTY_ACCOUNT });

  // Contacts data - starts empty, loaded in edit mode
  contacts = signal<AccountContact[]>([]);

  // Addresses data - starts empty, loaded in edit mode
  addresses = signal<Address[]>([]);

  // Shop orders data - starts empty, loaded in edit mode
  shopOrders = signal<ShopOrder[]>([]);

  // Manual entries data - starts empty, loaded in edit mode
  manualEntries = signal<ShopOrder[]>([]);

  // Machines data - starts empty, loaded in edit mode
  machines = signal<Machine[]>([]);

  // Tabs configuration
  tabs: TabItem[] = [
    { id: 'contacts', label: 'Contacts' },
    { id: 'addresses', label: 'Addresses' },
    { id: 'shop-orders', label: 'Shop orders' },
    { id: 'manual-entries', label: 'Manual entries' },
    { id: 'machines', label: 'Machines' }
  ];

  activeTab = signal('contacts');

  // Dropdown state
  openDropdownId = signal<number | null>(null);

  // Form state
  isActive = signal(true);
  isLegalEntity = signal(false);

  // Account type options for multi-select
  accountTypeOptions = [
    { value: 'client', label: 'Client' },
    { value: 'supplier', label: 'Supplier' },
    { value: 'partner', label: 'Partner' },
    { value: 'distributor', label: 'Distributor' }
  ];
  selectedAccountType = '';

  // Add account type
  onAccountTypeSelect(): void {
    if (this.selectedAccountType) {
      const option = this.accountTypeOptions.find(o => o.value === this.selectedAccountType);
      const currentTypes = this.account().accountType || [];
      if (option && !currentTypes.includes(option.label)) {
        this.account.update(a => ({
          ...a,
          accountType: [...(a.accountType || []), option.label]
        }));
      }
      this.selectedAccountType = '';
    }
  }

  // Remove account type
  removeAccountType(type: string): void {
    this.account.update(a => ({
      ...a,
      accountType: (a.accountType || []).filter(t => t !== type)
    }));
  }

  // Table actions
  contactActions: TableAction[] = [
    { id: 'edit', label: 'Edit', icon: 'pencil' },
    { id: 'delete', label: 'Delete', icon: 'trash', variant: 'danger' }
  ];

  addressActions: TableAction[] = [
    { id: 'edit', label: 'Edit', icon: 'pencil' },
    { id: 'delete', label: 'Delete', icon: 'trash', variant: 'danger' }
  ];

  ngOnInit(): void {
    // Subscribe to route param changes to handle navigation between add/edit
    this.route.paramMap
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        const accountId = params.get('id');
        if (accountId && accountId !== 'new') {
          this.isEditMode.set(true);
          this.loadAccount(+accountId);
        } else {
          // New account mode - reset to empty state
          this.isEditMode.set(false);
          this.resetForm();
        }
      });
  }

  ngAfterViewInit(): void {
    this.initColumns();
    this.cdr.detectChanges();
  }

  private initColumns(): void {
    // Contacts columns
    this.contactsColumns = [
      { key: 'id', label: 'Id', sortable: true, width: '88px' },
      { key: 'fullName', label: 'Full name', sortable: true },
      { key: 'email', label: 'Email', sortable: true },
      { key: 'phone', label: 'Phone', width: '160px' },
      { key: 'isBilling', label: 'Billing', sortable: true, width: '104px', template: this.contactBillingTemplate },
      { key: 'actions', label: '', width: '64px', template: this.contactActionsTemplate }
    ];

    // Addresses columns
    this.addressesColumns = [
      { key: 'id', label: 'Id', sortable: true, width: '88px' },
      { key: 'street', label: 'Street', sortable: true },
      { key: 'city', label: 'City', sortable: true },
      { key: 'country', label: 'Country', sortable: true },
      { key: 'isBilling', label: 'Billing', sortable: true, width: '104px', template: this.addressBillingTemplate },
      { key: 'isDelivery', label: 'Show as delivery', sortable: true, width: '140px', template: this.addressDeliveryTemplate },
      { key: 'actions', label: '', width: '64px', template: this.addressActionsTemplate }
    ];

    // Shop orders columns
    this.shopOrdersColumns = [
      { key: 'orderId', label: 'Order ID', width: '100px' },
      { key: 'type', label: 'Type', width: '80px', template: this.orderTypeTemplate },
      { key: 'dateCreated', label: 'Date Created', width: '140px' },
      { key: 'internalRef', label: 'Internal reference number' },
      { key: 'customer', label: 'Customer', width: '200px', template: this.orderCustomerTemplate },
      { key: 'partsOrdered', label: 'Parts ordered', width: '120px' },
      { key: 'status', label: 'Status', width: '120px', template: this.orderStatusTemplate },
      { key: 'actions', label: '', width: '64px', template: this.orderActionsTemplate }
    ];

    // Manual entries columns (same as shop orders)
    this.manualEntriesColumns = [
      { key: 'orderId', label: 'Order ID', width: '100px' },
      { key: 'type', label: 'Type', width: '80px', template: this.orderTypeTemplate },
      { key: 'dateCreated', label: 'Date Created', width: '140px' },
      { key: 'internalRef', label: 'Internal reference number' },
      { key: 'customer', label: 'Customer', width: '200px', template: this.orderCustomerTemplate },
      { key: 'partsOrdered', label: 'Parts ordered', width: '120px' },
      { key: 'status', label: 'Status', width: '120px', template: this.orderStatusTemplate },
      { key: 'actions', label: '', width: '64px', template: this.orderActionsTemplate }
    ];

    // Machines columns
    this.machinesColumns = [
      { key: 'machineId', label: 'Machine ID', width: '150px' },
      { key: 'location', label: 'Location', width: '200px' },
      { key: 'name', label: 'Name' },
      { key: 'actions', label: '', width: '64px', template: this.machineActionsTemplate }
    ];
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private resetForm(): void {
    this.account.set({ ...EMPTY_ACCOUNT });
    this.contacts.set([]);
    this.addresses.set([]);
    this.shopOrders.set([]);
    this.manualEntries.set([]);
    this.machines.set([]);
    this.isActive.set(true);
    this.isLegalEntity.set(false);
    this.activeTab.set('contacts');
    this.cdr.markForCheck();
  }

  private loadAccount(id: number): void {
    // In a real app, this would be an API call
    // For now, use mock data
    this.account.set({
      id: 317330,
      code: 'X012341AC',
      oib: 'PL7151954741',
      name: 'Company title',
      email: 'name@company.com',
      status: 'active',
      purchaseLimit: 15000,
      amountSpent: 200,
      isActive: true,
      isLegalEntity: true,
      accountType: ['Customer'],
      phone: '0048544735352',
      otherPhone: '',
      otherEmail: '',
      fax: '',
      web: 'www.company.com'
    });

    // Load related data
    this.contacts.set([
      { id: 317330, fullName: 'Akpol Recykling Sp.z.o.o.', email: 'anes@company.com', phone: '004873057807', isBilling: true },
      { id: 317331, fullName: 'Alaxe Italia Recycling S.p.A.', email: 'emanuel@company.com', phone: '004873057807', isBilling: true },
      { id: 317332, fullName: 'Kugo Repara SL', email: 'eroghan@company.com', phone: '004873057807', isBilling: false }
    ]);

    this.addresses.set([
      { id: 317330, street: 'Rzeczyca Ziemiańska, 225 A', city: 'Salzburg', country: 'Austria', isBilling: true, isDelivery: true },
      { id: 317331, street: 'Street name, 95 D', city: 'Frankfurt', country: 'Germany', isBilling: false, isDelivery: false }
    ]);

    this.shopOrders.set([
      { orderId: '0001', type: 'order', dateCreated: '14-03-2024', internalRef: '003234-LJK', customer: { name: 'Martin Ertl', initials: 'ME' }, partsOrdered: 12, status: 'completed' },
      { orderId: '0002', type: 'order', dateCreated: '14-03-2024', internalRef: '007890-QWE', customer: { name: 'Anes Kapetanovic', initials: 'AK', avatar: 'assets/avatars/anes.jpg' }, partsOrdered: 15, status: 'delayed' },
      { orderId: '0003', type: 'order', dateCreated: '14-03-2024', internalRef: '009876-RYT', customer: { name: 'Ivan Jozic', initials: 'IJ' }, partsOrdered: 84, status: 'failed' },
      { orderId: '0004', type: 'order', dateCreated: '14-03-2024', internalRef: '006543-PLM', customer: { name: 'Mira Kulic', initials: 'MK' }, partsOrdered: 30, status: 'in-review' },
      { orderId: '0005', type: 'order', dateCreated: '14-03-2024', internalRef: '008765-VBN', customer: { name: 'Yara Nasr', initials: 'YN' }, partsOrdered: 99, status: 'archived' }
    ]);

    this.manualEntries.set([
      { orderId: '0003', type: 'manual', dateCreated: '14-03-2024', internalRef: '003234-LJK', customer: { name: 'Martin Ertl', initials: 'ME' }, partsOrdered: 12, status: 'completed' },
      { orderId: '0010', type: 'manual', dateCreated: '14-03-2024', internalRef: '007890-QWE', customer: { name: 'Anes Kapetanovic', initials: 'AK', avatar: 'assets/avatars/anes.jpg' }, partsOrdered: 15, status: 'delayed' },
      { orderId: '0011', type: 'manual', dateCreated: '14-03-2024', internalRef: '009876-RYT', customer: { name: 'Ivan Jozic', initials: 'IJ' }, partsOrdered: 84, status: 'failed' },
      { orderId: '0023', type: 'manual', dateCreated: '14-03-2024', internalRef: '006543-PLM', customer: { name: 'Mira Kulic', initials: 'MK' }, partsOrdered: 30, status: 'in-review' },
      { orderId: '0030', type: 'manual', dateCreated: '14-03-2024', internalRef: '008765-VBN', customer: { name: 'Yara Nasr', initials: 'YN' }, partsOrdered: 99, status: 'archived' }
    ]);

    this.machines.set([
      { machineId: 'ZME-01171D', location: 'Frankfurt', name: '200XE Winding Machine' },
      { machineId: 'ZME-01171D', location: 'Frankfurt', name: 'ad*StarKON Machine' },
      { machineId: 'ZME-01171D', location: 'Frankfurt', name: 'starEX Machine' },
      { machineId: 'ZME-01171D', location: 'Frankfurt', name: 'Alpha 6.0 Machine' },
      { machineId: 'ZME-01171D', location: 'Frankfurt', name: 'Star EX 1600 ES Machine' }
    ]);

    this.isActive.set(true);
    this.isLegalEntity.set(true);
    this.cdr.markForCheck();
  }

  // Computed values
  totalContacts = computed(() => this.contacts().length);
  totalAddresses = computed(() => this.addresses().length);
  totalShopOrders = computed(() => this.shopOrders().length);
  totalManualEntries = computed(() => this.manualEntries().length);
  totalMachines = computed(() => this.machines().length);

  // Get current tab count
  currentTabCount = computed(() => {
    switch (this.activeTab()) {
      case 'contacts': return this.totalContacts();
      case 'addresses': return this.totalAddresses();
      case 'shop-orders': return this.totalShopOrders();
      case 'manual-entries': return this.totalManualEntries();
      case 'machines': return this.totalMachines();
      default: return 0;
    }
  });

  // Get add button text based on active tab
  addButtonText = computed(() => {
    switch (this.activeTab()) {
      case 'contacts': return 'Add contact';
      case 'addresses': return 'Add address';
      case 'shop-orders': return 'Add order';
      case 'manual-entries': return 'Add entry';
      case 'machines': return 'Add machine';
      default: return 'Add';
    }
  });

  // Get status badge variant
  getStatusVariant(status: string): 'success' | 'warning' | 'danger' | 'secondary' | 'info' {
    switch (status) {
      case 'completed': return 'success';
      case 'delayed': return 'warning';
      case 'failed': return 'danger';
      case 'in-review': return 'secondary';
      case 'archived': return 'secondary';
      default: return 'secondary';
    }
  }

  // Get status label
  getStatusLabel(status: string): string {
    switch (status) {
      case 'completed': return 'Completed';
      case 'delayed': return 'Delayed';
      case 'failed': return 'Failed';
      case 'in-review': return 'In Review';
      case 'archived': return 'Archived';
      default: return status;
    }
  }

  onActiveChange(value: boolean): void {
    this.isActive.set(value);
  }

  onLegalEntityChange(value: boolean): void {
    this.isLegalEntity.set(value);
  }

  onTabChange(tabId: string): void {
    this.activeTab.set(tabId);
  }

  toggleDropdown(id: number): void {
    if (this.openDropdownId() === id) {
      this.openDropdownId.set(null);
    } else {
      this.openDropdownId.set(id);
    }
  }

  closeDropdown(): void {
    this.openDropdownId.set(null);
  }

  onContactActionClick(event: ActionClickEvent): void {
    const contact = event.row as AccountContact;
    switch (event.actionId) {
      case 'edit':
        this.onEdit(contact);
        break;
      case 'delete':
        this.onDelete(contact);
        break;
    }
  }

  onAddressActionClick(event: ActionClickEvent): void {
    const address = event.row as Address;
    switch (event.actionId) {
      case 'edit':
        console.log('Edit address:', address);
        this.closeDropdown();
        break;
      case 'delete':
        console.log('Delete address:', address);
        this.closeDropdown();
        break;
    }
  }

  onEdit(contact: AccountContact): void {
    console.log('Edit contact:', contact);
    this.closeDropdown();
  }

  onDelete(contact: AccountContact): void {
    console.log('Delete contact:', contact);
    this.closeDropdown();
  }

  onSave(): void {
    console.log('Saving account...');
  }

  onSaveAndContinue(): void {
    console.log('Saving and continuing...');
  }

  onAddContact(): void {
    console.log('Adding contact...');
  }

  goBack(): void {
    window.history.back();
  }

  formatCurrency(value: number | undefined): string {
    if (value === undefined) return '–';
    return `€ ${value.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
}
