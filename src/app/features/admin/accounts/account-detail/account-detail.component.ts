import { Component, ChangeDetectionStrategy, ChangeDetectorRef, signal, computed, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

import { ToggleComponent } from '@app/ui-kit/atoms/toggle/toggle.component';
import { TabsComponent, TabItem } from '@app/ui-kit/molecules/tabs/tabs.component';
import { BadgeComponent } from '@app/ui-kit/atoms/badge/badge.component';
import { ButtonComponent } from '@app/ui-kit/atoms/button/button.component';
import { CardComponent } from '@app/ui-kit/molecules/card/card.component';
import { InputComponent } from '@app/ui-kit/atoms/input/input.component';
import { FormFieldComponent } from '@app/ui-kit/molecules/form-field/form-field.component';
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
    ButtonComponent,
    CardComponent,
    InputComponent,
    FormFieldComponent
  ],
  templateUrl: './account-detail.component.html',
  styleUrls: ['./account-detail.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AccountDetailComponent implements OnInit, OnDestroy {
  private cdr = inject(ChangeDetectorRef);
  private route = inject(ActivatedRoute);
  private destroy$ = new Subject<void>();

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

  toggleDropdown(contactId: number, event: Event): void {
    event.stopPropagation();
    if (this.openDropdownId() === contactId) {
      this.openDropdownId.set(null);
    } else {
      this.openDropdownId.set(contactId);
    }
  }

  closeDropdown(): void {
    this.openDropdownId.set(null);
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

