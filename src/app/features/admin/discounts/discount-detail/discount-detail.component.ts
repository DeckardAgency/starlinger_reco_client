import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, signal, computed, ViewChild, TemplateRef, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { BadgeComponent } from '@app/ui-kit/atoms/badge/badge.component';
import { ToggleComponent } from '@app/ui-kit/atoms/toggle/toggle.component';
import { FormFieldComponent } from '@app/ui-kit/molecules/form-field/form-field.component';
import { DataTableComponent, TableColumn, SortEvent } from '@app/ui-kit/organisms/data-table/data-table.component';
import { PaginationComponent } from '@app/ui-kit/molecules/pagination/pagination.component';

interface DiscountDetail {
  id: string;
  name: string;
  active: boolean;
  dateFrom: string;
  dateTo: string;
  discountPercent: number;
  priority: number;
  accountGroups: string[];
  accounts: string[];
}

interface DiscountProduct {
  id: string;
  code: string;
  shortDescription: string;
}

const EMPTY_DISCOUNT: DiscountDetail = {
  id: '',
  name: '',
  active: false,
  dateFrom: '',
  dateTo: '',
  discountPercent: 0,
  priority: 0,
  accountGroups: [],
  accounts: []
};

@Component({
  selector: 'app-discount-detail',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    BadgeComponent,
    ToggleComponent,
    FormFieldComponent,
    DataTableComponent,
    PaginationComponent
  ],
  templateUrl: './discount-detail.component.html',
  styleUrls: ['./discount-detail.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DiscountDetailComponent implements OnInit, OnDestroy, AfterViewInit {
  private destroy$ = new Subject<void>();
  private discountId: string | null = null;

  @ViewChild('productActionsTemplate') productActionsTemplate!: TemplateRef<any>;

  // Form state
  discount = signal<DiscountDetail>({ ...EMPTY_DISCOUNT });
  isEditMode = signal(false);
  isLoading = signal(false);

  // Products table
  products = signal<DiscountProduct[]>([]);
  productColumns: TableColumn[] = [];
  sortColumn: string | null = null;
  sortDirection: 'asc' | 'desc' | null = null;
  searchQuery = '';

  // Pagination
  currentPage = signal(1);
  itemsPerPage = signal(12);
  totalItems = computed(() => this.products().length);
  totalPages = computed(() => Math.ceil(this.totalItems() / this.itemsPerPage()));

  // Dropdown state
  openDropdownId = signal<string | null>(null);

  // Account options (mock data)
  accountGroupOptions = [
    { value: 'group1', label: 'VIP Clients' },
    { value: 'group2', label: 'Standard Clients' },
    { value: 'group3', label: 'Wholesale Partners' }
  ];

  accountOptions = [
    { value: 'acc1', label: 'Recycling team Gmbh' },
    { value: 'acc2', label: 'Rodomsko recycling' },
    { value: 'acc3', label: 'General recycling group' },
    { value: 'acc4', label: 'ABC Industries' },
    { value: 'acc5', label: 'XYZ Manufacturing' }
  ];

  // Selected values (for select fields)
  selectedAccountGroup = '';
  selectedAccount = '';

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe(params => {
      this.discountId = params['id'] || null;
      this.isEditMode.set(!!this.discountId && this.discountId !== 'new');

      if (this.isEditMode()) {
        this.loadDiscount(this.discountId!);
        this.loadProducts();
      } else {
        // New discount - reset form
        this.discount.set({ ...EMPTY_DISCOUNT });
      }
    });
  }

  ngAfterViewInit(): void {
    this.initProductColumns();
    this.cdr.detectChanges();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initProductColumns(): void {
    this.productColumns = [
      { key: 'code', label: 'Product code', sortable: false, width: '195px' },
      { key: 'shortDescription', label: 'Short description', sortable: false },
      { key: 'actions', label: '', sortable: false, width: '64px', template: this.productActionsTemplate }
    ];
  }

  private loadDiscount(id: string): void {
    this.isLoading.set(true);

    // Mock data - in real app this would be an API call
    setTimeout(() => {
      this.discount.set({
        id: id,
        name: 'ET -30%',
        active: true,
        dateFrom: '01/01/2025',
        dateTo: '01/01/2025',
        discountPercent: 30,
        priority: 0,
        accountGroups: ['group1'],
        accounts: ['acc1', 'acc2']
      });
      this.isLoading.set(false);
      this.cdr.markForCheck();
    }, 100);
  }

  private loadProducts(): void {
    // Mock data - in real app this would be an API call
    this.products.set([
      { id: '1', code: 'BC0083_X20BC0083', shortDescription: 'BC0083_X20BC0083; BC0083_X20BC0083' },
      { id: '2', code: 'BC0083_X20BC0083', shortDescription: 'BC0083_X20BC0083; BC0083_X20BC0083' },
      { id: '3', code: 'BC0083_X20BC0083', shortDescription: 'BC0083_X20BC0083; BC0083_X20BC0083' },
      { id: '4', code: 'BC0083_X20BC0083', shortDescription: 'BC0083_X20BC0083; BC0083_X20BC0083' },
      { id: '5', code: 'BC0083_X20BC0083', shortDescription: 'BC0083_X20BC0083; BC0083_X20BC0083' },
      { id: '6', code: 'BC0083_X20BC0083', shortDescription: 'BC0083_X20BC0083; BC0083_X20BC0083' },
      { id: '7', code: 'BC0083_X20BC0083', shortDescription: 'BC0083_X20BC0083; BC0083_X20BC0083' },
      { id: '8', code: 'BC0083_X20BC0083', shortDescription: 'BC0083_X20BC0083; BC0083_X20BC0083' },
      { id: '9', code: 'BC0083_X20BC0083', shortDescription: 'BC0083_X20BC0083; BC0083_X20BC0083' },
      { id: '10', code: 'BC0083_X20BC0083', shortDescription: 'BC0083_X20BC0083; BC0083_X20BC0083' },
      { id: '11', code: 'BC0083_X20BC0083', shortDescription: 'BC0083_X20BC0083; BC0083_X20BC0083' },
      { id: '12', code: 'BC0083_X20BC0083', shortDescription: 'BC0083_X20BC0083; BC0083_X20BC0083' }
    ]);
  }

  // Navigation
  goBack(): void {
    this.router.navigate(['/admin/discounts']);
  }

  // Form handlers
  onActiveChange(active: boolean): void {
    this.discount.update(d => ({ ...d, active }));
  }

  onNameChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.discount.update(d => ({ ...d, name: value }));
  }

  onDateFromChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.discount.update(d => ({ ...d, dateFrom: value }));
  }

  onDateToChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.discount.update(d => ({ ...d, dateTo: value }));
  }

  onDiscountPercentChange(event: Event): void {
    const value = parseFloat((event.target as HTMLInputElement).value) || 0;
    this.discount.update(d => ({ ...d, discountPercent: value }));
  }

  onPriorityChange(event: Event): void {
    const value = parseInt((event.target as HTMLInputElement).value) || 0;
    this.discount.update(d => ({ ...d, priority: value }));
  }

  onAccountGroupChange(): void {
    if (this.selectedAccountGroup) {
      this.discount.update(d => ({
        ...d,
        accountGroups: [...new Set([...d.accountGroups, this.selectedAccountGroup])]
      }));
      this.selectedAccountGroup = '';
    }
  }

  onAccountChange(): void {
    if (this.selectedAccount) {
      this.discount.update(d => ({
        ...d,
        accounts: [...new Set([...d.accounts, this.selectedAccount])]
      }));
      this.selectedAccount = '';
    }
  }

  removeAccountGroup(value: string): void {
    this.discount.update(d => ({
      ...d,
      accountGroups: d.accountGroups.filter(g => g !== value)
    }));
  }

  removeAccount(value: string): void {
    this.discount.update(d => ({
      ...d,
      accounts: d.accounts.filter(a => a !== value)
    }));
  }

  getAccountGroupLabel(value: string): string {
    return this.accountGroupOptions.find(o => o.value === value)?.label || value;
  }

  getAccountLabel(value: string): string {
    return this.accountOptions.find(o => o.value === value)?.label || value;
  }

  // Save actions
  onSave(): void {
    console.log('Saving discount:', this.discount());
    this.router.navigate(['/admin/discounts']);
  }

  onSaveAndContinue(): void {
    console.log('Save and continue:', this.discount());
  }

  // Table handlers
  onSortChange(event: SortEvent): void {
    this.sortColumn = event.column;
    this.sortDirection = event.direction;
  }

  onSearch(): void {
    console.log('Searching:', this.searchQuery);
  }

  onPageChange(page: number): void {
    this.currentPage.set(page);
  }

  // Dropdown
  toggleDropdown(productId: string, event: Event): void {
    event.stopPropagation();
    if (this.openDropdownId() === productId) {
      this.openDropdownId.set(null);
    } else {
      this.openDropdownId.set(productId);
    }
  }

  closeDropdown(): void {
    this.openDropdownId.set(null);
  }

  // Product actions
  onRemoveProduct(product: DiscountProduct): void {
    this.products.update(list => list.filter(p => p.id !== product.id));
    this.closeDropdown();
  }
}

