import { Component, ChangeDetectionStrategy, ChangeDetectorRef, signal, computed, ViewChild, TemplateRef, AfterViewInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';

import { DataTableComponent, TableColumn, SortEvent } from '@app/ui-kit/organisms/data-table/data-table.component';

interface Product {
  id: string;
  code: string;
  name: string;
  shortDescription: string;
  qty: number;
  qtyStep: number;
  selected?: boolean;
}

@Component({
  selector: 'app-admin-products',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    DataTableComponent
  ],
  templateUrl: './products.component.html',
  styleUrls: ['./products.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProductsComponent implements AfterViewInit {
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  @ViewChild('checkboxTemplate') checkboxTemplate!: TemplateRef<any>;
  @ViewChild('checkboxHeaderTemplate') checkboxHeaderTemplate!: TemplateRef<any>;
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
  
  // Header dropdown state (for select all)
  isHeaderDropdownOpen = signal(false);

  // Selection state
  selectAll = signal(false);
  
  // Computed: selected products count
  selectedCount = computed(() => this.products().filter(p => p.selected).length);
  
  // Computed: has any selected
  hasSelected = computed(() => this.selectedCount() > 0);

  // Table columns
  columns: TableColumn[] = [];

  // Mock data
  products = signal<Product[]>([
    { id: '0001', code: 'AIVS-01197', name: 'Analog input module', shortDescription: 'BC0083_X20BC0083; BC0083_X20BC0083', qty: 9999, qtyStep: 1 },
    { id: '0002', code: 'AIVS-01199', name: 'Block: Klotz', shortDescription: 'BM11_X20BM11; STANDARD_X20BM11', qty: 9999, qtyStep: 1 },
    { id: '0003', code: 'AESA-0002', name: 'Bus Controller', shortDescription: '3 - 12 A / 24 VDC_LUCL 12BL; (FU) 3 - 12 A / 24 VDC_LUCL 12BL', qty: 9999, qtyStep: 1 },
    { id: '0004', code: 'AESA-0001', name: 'Bus Modul', shortDescription: 'T0,15 - 0,6 A / 24 VDC_LUCB X6BL; 0,15 - 0,6 A / 24 VDC_LUCB X6BL', qty: 9999, qtyStep: 1 },
    { id: '0005', code: 'Z3I-10337A', name: 'Cartridge heater', shortDescription: '36 X D3,4 X 6,0 FT04; 36 X D3,4 X 6,0 FT04', qty: 9999, qtyStep: 1 },
    { id: '0006', code: 'AESA-0001', name: 'Control unit adjusted', shortDescription: 'DI9371_X20DI9371; DI9371_X20DI9371', qty: 9999, qtyStep: 1 },
    { id: '0007', code: 'AIVS-01197', name: 'Control unit extension', shortDescription: '24 X D3,4 X 6,0 FT04; 24 X D3,4 X 6,0 FT04', qty: 9999, qtyStep: 1 },
    { id: '0008', code: 'Z3I-10337A', name: 'Die plate', shortDescription: '1kW, 460V, 20 x 90, IP54; 1kW, 460V, 20 x 90, IP54', qty: 9999, qtyStep: 1 },
    { id: '0009', code: 'AESA-0001', name: 'Digital input module', shortDescription: 'DO8332_X20DO8332; DO8332_X20DO8332', qty: 9999, qtyStep: 1 },
    { id: '0010', code: 'AIVS-01197', name: 'Energy measurement module', shortDescription: 'D125,3 / MESH 12; D125,3 / MESH 12 / 1250my', qty: 9999, qtyStep: 1 },
    { id: '0011', code: 'AESA-0001', name: 'Fill level limit switch', shortDescription: 'D250 / MESH 25; D250 / MESH 25', qty: 9999, qtyStep: 1 },
    { id: '0012', code: 'AESA-0001', name: 'Filter blank', shortDescription: 'D250 / MESH 50/250 / 50my; D250 / MESH 50/250 / 50my', qty: 9999, qtyStep: 10 },
    { id: '0013', code: 'AIVS-01197', name: 'Filter blank', shortDescription: '80M3/MIN; AUFSTECKBAR 80M3/MIN', qty: 9999, qtyStep: 10 },
    { id: '0014', code: 'Z3I-10337A', name: 'Filter blank', shortDescription: 'NR. 618.50; NR. 618.50', qty: 9999, qtyStep: 100 },
    { id: '0015', code: 'Z3I-10337A', name: 'Filter blank', shortDescription: 'MATERIAL HSS; MATERIAL HSS', qty: 9999, qtyStep: 100 },
    { id: '0016', code: 'Z3I-10337A', name: 'Filter blank', shortDescription: 'MESSERBESTIGUNG UEBER M12', qty: 9999, qtyStep: 100 },
    { id: '0017', code: 'AESA-0001', name: 'Granulating knife', shortDescription: 'Fe-CuNi, 1/2\'-20 UNF, l=1,0m; Fe-CuNi, 1/2\'-20 UNF, l=1,0m', qty: 9999, qtyStep: 100 }
  ]);

  // Total count
  totalCount = computed(() => this.products().length);

  ngAfterViewInit(): void {
    this.initColumns();
    this.cdr.detectChanges();
  }

  private initColumns(): void {
    this.columns = [
      { key: 'checkbox', label: '', sortable: false, width: '56px', template: this.checkboxTemplate, headerTemplate: this.checkboxHeaderTemplate },
      { key: 'id', label: 'Product ID', sortable: false, width: '112px' },
      { key: 'code', label: 'Code', sortable: false, width: '128px' },
      { key: 'name', label: 'Name', sortable: true, width: '266px' },
      { key: 'shortDescription', label: 'Short description', sortable: false },
      { key: 'qty', label: 'Qty', sortable: false, width: '96px' },
      { key: 'qtyStep', label: 'Qty step', sortable: false, width: '96px' },
      { key: 'actions', label: '', sortable: false, width: '64px', template: this.actionsTemplate }
    ];
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

  onAddProduct(): void {
    console.log('Adding new product...');
    this.router.navigate(['/admin/products/new']);
  }

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
    this.isHeaderDropdownOpen.set(false);
  }

  onEdit(product: Product): void {
    console.log('Edit product:', product);
    this.router.navigate(['/admin/products', product.id]);
    this.closeDropdown();
  }

  onClone(product: Product): void {
    console.log('Clone product:', product);
    this.closeDropdown();
  }

  onDelete(product: Product): void {
    console.log('Delete product:', product);
    this.closeDropdown();
  }

  onBulkDelete(): void {
    const selected = this.products().filter(p => p.selected);
    console.log('Bulk delete products:', selected);
    // Remove selected products (mock implementation)
    const remaining = this.products().filter(p => !p.selected);
    this.products.set(remaining);
    this.selectAll.set(false);
  }

  toggleHeaderDropdown(event: Event): void {
    event.stopPropagation();
    this.isHeaderDropdownOpen.set(!this.isHeaderDropdownOpen());
    this.openDropdownId.set(null); // Close any row dropdowns
  }

  closeHeaderDropdown(): void {
    this.isHeaderDropdownOpen.set(false);
  }

  onSelectAll(): void {
    const updated = this.products().map(p => ({ ...p, selected: true }));
    this.products.set(updated);
    this.selectAll.set(true);
    this.closeHeaderDropdown();
  }

  onSelectNone(): void {
    const updated = this.products().map(p => ({ ...p, selected: false }));
    this.products.set(updated);
    this.selectAll.set(false);
    this.closeHeaderDropdown();
  }

  toggleProductSelection(product: Product): void {
    const updated = this.products().map(p => 
      p.id === product.id ? { ...p, selected: !p.selected } : p
    );
    this.products.set(updated);
    // Update selectAll based on all products being selected
    this.selectAll.set(updated.every(p => p.selected));
  }

  formatNumber(value: number): string {
    return value.toLocaleString('de-DE');
  }
}
