import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, signal, ChangeDetectorRef, ViewChild, TemplateRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { FormFieldComponent } from '@app/ui-kit/molecules/form-field/form-field.component';
import { DataTableComponent, TableColumn } from '@app/ui-kit/organisms/data-table/data-table.component';
import { ModalComponent } from '@app/ui-kit/organisms/modal/modal.component';
import { BreadcrumbsComponent } from '@app/ui-kit/molecules/breadcrumbs/breadcrumbs.component';
import { DetailHeaderComponent } from '@app/ui-kit/molecules/detail-header/detail-header.component';
import { MobileFooterComponent } from '@app/ui-kit/molecules/mobile-footer/mobile-footer.component';
import { IconComponent } from '@app/ui-kit/atoms/icon/icon.component';
import { ToggleComponent } from '@app/ui-kit/atoms/toggle/toggle.component';
import { TabsComponent, TabItem } from '@app/ui-kit/molecules/tabs/tabs.component';
import { TableCheckboxSelectionComponent } from '@app/ui-kit/molecules/table-checkbox-selection/table-checkbox-selection.component';
import { TableActionsDropdownComponent, TableAction, ActionClickEvent } from '@app/ui-kit/molecules/table-actions-dropdown/table-actions-dropdown.component';
import { TextEditorComponent } from '@shared/components/text-editor/text-editor.component';
import { WarehouseDocument } from '@core/models/warehouse.model';

interface WarehouseDetail {
  id: string;
  name: string;
  contactPerson: string;
  address: string;
  city: string;
  phone: string;
  email: string;
  url: string;
  readyForShop: boolean;
  active: boolean;
  enableForCheckout: boolean;
  shortDescription: string;
  documents: WarehouseDocument[];
}

const EMPTY_WAREHOUSE: WarehouseDetail = {
  id: '',
  name: '',
  contactPerson: '',
  address: '',
  city: '',
  phone: '',
  email: '',
  url: '',
  readyForShop: false,
  active: false,
  enableForCheckout: false,
  shortDescription: '',
  documents: []
};

@Component({
  selector: 'app-warehouse-detail',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    FormFieldComponent,
    DataTableComponent,
    ModalComponent,
    BreadcrumbsComponent,
    DetailHeaderComponent,
    MobileFooterComponent,
    IconComponent,
    ToggleComponent,
    TabsComponent,
    TableCheckboxSelectionComponent,
    TableActionsDropdownComponent,
    TextEditorComponent
  ],
  templateUrl: './warehouse-detail.component.html',
  styleUrls: ['./warehouse-detail.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class WarehouseDetailComponent implements OnInit, OnDestroy, AfterViewInit {
  private destroy$ = new Subject<void>();

  @ViewChild('checkboxTemplate') checkboxTemplate!: TemplateRef<any>;
  @ViewChild('checkboxHeaderTemplate') checkboxHeaderTemplate!: TemplateRef<any>;
  @ViewChild('actionsTemplate') actionsTemplate!: TemplateRef<any>;

  // Mode
  isEditMode = signal(false);
  warehouseId: string | null = null;

  // Data
  warehouse = signal<WarehouseDetail>({ ...EMPTY_WAREHOUSE });

  // Loading state
  isLoading = signal(false);

  // Active tab
  activeTab = signal<'description' | 'documents'>('description');
  
  // Tabs configuration
  tabs: TabItem[] = [
    { id: 'description', label: 'Short description' },
    { id: 'documents', label: 'Warehouse documents' }
  ];

  // Documents table columns
  documentColumns: TableColumn[] = [];

  // Header dropdown state
  isHeaderDropdownOpen = signal(false);

  // Document action dropdown state
  activeDocActionId = signal<string | null>(null);

  // Rename modal state
  isRenameModalOpen = signal(false);
  renameValue = signal('');
  renameDocumentId = signal<string | null>(null);

  // Selection state
  selectAll = signal(false);

  // Document actions
  documentActions: TableAction[] = [
    { id: 'rename', label: 'Rename', icon: 'pencil' },
    { id: 'download', label: 'Download', icon: 'download' },
    { id: 'delete', label: 'Delete', icon: 'trash', variant: 'danger' }
  ];

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe(params => {
      if (params['id'] && params['id'] !== 'new') {
        this.isEditMode.set(true);
        this.warehouseId = params['id'];
        this.loadWarehouse(this.warehouseId!);
      }
    });
  }

  ngAfterViewInit(): void {
    this.initDocumentColumns();
    this.cdr.detectChanges();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initDocumentColumns(): void {
    this.documentColumns = [
      { key: 'checkbox', label: '', sortable: false, width: '56px', template: this.checkboxTemplate, headerTemplate: this.checkboxHeaderTemplate },
      { key: 'fileType', label: 'File type', sortable: false, width: '112px' },
      { key: 'name', label: 'Name', sortable: false },
      { key: 'size', label: 'Size', sortable: false, width: '149px' },
      { key: 'actions', label: '', sortable: false, width: '72px', template: this.actionsTemplate }
    ];
  }

  private loadWarehouse(id: string): void {
    this.isLoading.set(true);
    import('@core/mocks/mock-data').then(({ mockWarehouses }) => {
      const found = mockWarehouses.find(w => w.id === id);
      if (found) {
        this.warehouse.set({
          ...found,
          documents: found.documents.map(d => ({ ...d, selected: false }))
        });
      }
      this.isLoading.set(false);
      this.cdr.markForCheck();
    });
  }

  onBack(): void {
    this.router.navigate(['/admin/warehouses']);
  }

  onSave(): void {
    console.log('Save warehouse:', this.warehouse());
    this.router.navigate(['/admin/warehouses']);
  }

  onSaveAndContinue(): void {
    console.log('Save and continue:', this.warehouse());
  }

  setActiveTab(tabId: string): void {
    this.activeTab.set(tabId as 'description' | 'documents');
  }

  // Toggle handlers
  toggleReadyForShop(): void {
    this.warehouse.update(w => ({ ...w, readyForShop: !w.readyForShop }));
  }

  toggleActive(): void {
    this.warehouse.update(w => ({ ...w, active: !w.active }));
  }

  toggleEnableForCheckout(): void {
    this.warehouse.update(w => ({ ...w, enableForCheckout: !w.enableForCheckout }));
  }

  // Input handlers
  onContactPersonChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.warehouse.update(w => ({ ...w, contactPerson: input.value }));
  }

  onNameChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.warehouse.update(w => ({ ...w, name: input.value }));
  }

  onAddressChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.warehouse.update(w => ({ ...w, address: input.value }));
  }

  onCityChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.warehouse.update(w => ({ ...w, city: input.value }));
  }

  onPhoneChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.warehouse.update(w => ({ ...w, phone: input.value }));
  }

  onEmailChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.warehouse.update(w => ({ ...w, email: input.value }));
  }

  onUrlChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.warehouse.update(w => ({ ...w, url: input.value }));
  }

  onShortDescriptionChange(content: string): void {
    this.warehouse.update(w => ({ ...w, shortDescription: content }));
  }

  // Document handlers
  onAddDocument(): void {
    console.log('Add document');
  }

  onHeaderDropdownToggle(isOpen: boolean): void {
    this.isHeaderDropdownOpen.set(isOpen);
  }

  onSelectAllDocuments(): void {
    const updated = this.warehouse().documents.map(d => ({ ...d, selected: true }));
    this.warehouse.update(w => ({ ...w, documents: updated }));
    this.selectAll.set(true);
    this.isHeaderDropdownOpen.set(false);
  }

  onSelectNoneDocuments(): void {
    const updated = this.warehouse().documents.map(d => ({ ...d, selected: false }));
    this.warehouse.update(w => ({ ...w, documents: updated }));
    this.selectAll.set(false);
    this.isHeaderDropdownOpen.set(false);
  }

  toggleDocumentSelection(doc: WarehouseDocument): void {
    const updated = this.warehouse().documents.map(d => 
      d.id === doc.id ? { ...d, selected: !d.selected } : d
    );
    this.warehouse.update(w => ({ ...w, documents: updated }));
  }

  toggleDocumentActions(docId: string): void {
    if (this.activeDocActionId() === docId) {
      this.activeDocActionId.set(null);
    } else {
      this.activeDocActionId.set(docId);
    }
  }

  closeDocActionsDropdown(): void {
    this.activeDocActionId.set(null);
  }

  onDocumentActionClick(event: ActionClickEvent): void {
    const doc = event.row as WarehouseDocument;
    switch (event.actionId) {
      case 'rename':
        this.renameDocument(doc.id);
        break;
      case 'download':
        this.downloadDocument(doc.id);
        break;
      case 'delete':
        this.deleteDocument(doc.id);
        break;
    }
  }

  renameDocument(docId: string): void {
    const doc = this.warehouse().documents.find(d => d.id === docId);
    if (doc) {
      this.renameDocumentId.set(docId);
      this.renameValue.set(doc.name);
      this.isRenameModalOpen.set(true);
    }
    this.activeDocActionId.set(null);
  }

  downloadDocument(docId: string): void {
    const doc = this.warehouse().documents.find(d => d.id === docId);
    console.log('Download document:', doc);
    this.activeDocActionId.set(null);
  }

  deleteDocument(docId: string): void {
    const updated = this.warehouse().documents.filter(d => d.id !== docId);
    this.warehouse.update(w => ({ ...w, documents: updated }));
    this.activeDocActionId.set(null);
  }

  onRenameInputChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.renameValue.set(input.value);
  }

  confirmRename(): void {
    const docId = this.renameDocumentId();
    if (docId) {
      const updated = this.warehouse().documents.map(d => 
        d.id === docId ? { ...d, name: this.renameValue() } : d
      );
      this.warehouse.update(w => ({ ...w, documents: updated }));
    }
    this.cancelRename();
  }

  cancelRename(): void {
    this.isRenameModalOpen.set(false);
    this.renameDocumentId.set(null);
    this.renameValue.set('');
  }

  closeDropdowns(): void {
    this.isHeaderDropdownOpen.set(false);
    this.activeDocActionId.set(null);
  }
}
