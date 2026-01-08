import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, signal, ChangeDetectorRef, ViewChild, TemplateRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { FormFieldComponent } from '@app/ui-kit/molecules/form-field/form-field.component';
import { DataTableComponent, TableColumn } from '@app/ui-kit/organisms/data-table/data-table.component';
import { ModalComponent } from '@app/ui-kit/organisms/modal/modal.component';
import { PaymentType, PaymentTypeDocument } from '@core/models/payment-type.model';

interface PaymentTypeDetail {
  id: string;
  name: string;
  active: boolean;
  readyForShop: boolean;
  enableInstallments: boolean;
  configuration: string | null;
  providerCode: string | null;
  shortDescription: string;
  useAsDefaultBase: boolean;
  remoteCode: string | null;
  paymentFee: number;
  minCartTotalBase: number;
  maxCartTotalBase: number;
  documents: PaymentTypeDocument[];
}

const EMPTY_PAYMENT_TYPE: PaymentTypeDetail = {
  id: '',
  name: '',
  active: false,
  readyForShop: false,
  enableInstallments: false,
  configuration: null,
  providerCode: null,
  shortDescription: '',
  useAsDefaultBase: false,
  remoteCode: null,
  paymentFee: 0,
  minCartTotalBase: 0,
  maxCartTotalBase: 0,
  documents: []
};

@Component({
  selector: 'app-payment-type-detail',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    FormFieldComponent,
    DataTableComponent,
    ModalComponent
  ],
  templateUrl: './payment-type-detail.component.html',
  styleUrls: ['./payment-type-detail.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PaymentTypeDetailComponent implements OnInit, OnDestroy, AfterViewInit {
  private destroy$ = new Subject<void>();

  @ViewChild('checkboxTemplate') checkboxTemplate!: TemplateRef<any>;
  @ViewChild('checkboxHeaderTemplate') checkboxHeaderTemplate!: TemplateRef<any>;
  @ViewChild('actionsTemplate') actionsTemplate!: TemplateRef<any>;

  // Mode
  isEditMode = signal(false);
  paymentTypeId: string | null = null;

  // Data
  paymentType = signal<PaymentTypeDetail>({ ...EMPTY_PAYMENT_TYPE });

  // Loading state
  isLoading = signal(false);

  // Active tab
  activeTab = signal<'description' | 'details' | 'documents'>('description');

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

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe(params => {
      if (params['id'] && params['id'] !== 'new') {
        this.isEditMode.set(true);
        this.paymentTypeId = params['id'];
        this.loadPaymentType(this.paymentTypeId!);
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

  private loadPaymentType(id: string): void {
    this.isLoading.set(true);
    import('@core/mocks/mock-data').then(({ mockPaymentTypes }) => {
      const found = mockPaymentTypes.find(p => p.id === id);
      if (found) {
        this.paymentType.set({
          ...found,
          documents: found.documents.map(d => ({ ...d, selected: false }))
        });
      }
      this.isLoading.set(false);
      this.cdr.markForCheck();
    });
  }

  onBack(): void {
    this.router.navigate(['/admin/payment-types']);
  }

  onSave(): void {
    console.log('Save payment type:', this.paymentType());
    this.router.navigate(['/admin/payment-types']);
  }

  onSaveAndContinue(): void {
    console.log('Save and continue:', this.paymentType());
  }

  setActiveTab(tab: 'description' | 'details' | 'documents'): void {
    this.activeTab.set(tab);
  }

  // Toggle handlers
  toggleActive(): void {
    this.paymentType.update(p => ({ ...p, active: !p.active }));
  }

  toggleReadyForShop(): void {
    this.paymentType.update(p => ({ ...p, readyForShop: !p.readyForShop }));
  }

  toggleEnableInstallments(): void {
    this.paymentType.update(p => ({ ...p, enableInstallments: !p.enableInstallments }));
  }

  toggleUseAsDefaultBase(): void {
    this.paymentType.update(p => ({ ...p, useAsDefaultBase: !p.useAsDefaultBase }));
  }

  // Input handlers
  onNameChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.paymentType.update(p => ({ ...p, name: input.value }));
  }

  onConfigurationChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.paymentType.update(p => ({ ...p, configuration: input.value || null }));
  }

  onProviderCodeChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.paymentType.update(p => ({ ...p, providerCode: input.value || null }));
  }

  onRemoteCodeChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.paymentType.update(p => ({ ...p, remoteCode: input.value || null }));
  }

  onPaymentFeeChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = parseFloat(input.value.replace(',', '.')) || 0;
    this.paymentType.update(p => ({ ...p, paymentFee: value }));
  }

  onMinCartTotalBaseChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = parseFloat(input.value.replace(',', '.')) || 0;
    this.paymentType.update(p => ({ ...p, minCartTotalBase: value }));
  }

  onMaxCartTotalBaseChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = parseFloat(input.value.replace(',', '.')) || 0;
    this.paymentType.update(p => ({ ...p, maxCartTotalBase: value }));
  }

  onShortDescriptionChange(event: Event): void {
    const textarea = event.target as HTMLTextAreaElement;
    this.paymentType.update(p => ({ ...p, shortDescription: textarea.value }));
  }

  formatNumber(value: number): string {
    return value.toFixed(2).replace('.', ',');
  }

  // Document handlers
  onAddDocument(): void {
    console.log('Add document');
  }

  toggleHeaderDropdown(event: Event): void {
    event.stopPropagation();
    this.isHeaderDropdownOpen.set(!this.isHeaderDropdownOpen());
  }

  onSelectAllDocuments(): void {
    const updated = this.paymentType().documents.map(d => ({ ...d, selected: true }));
    this.paymentType.update(p => ({ ...p, documents: updated }));
    this.selectAll.set(true);
    this.isHeaderDropdownOpen.set(false);
  }

  onSelectNoneDocuments(): void {
    const updated = this.paymentType().documents.map(d => ({ ...d, selected: false }));
    this.paymentType.update(p => ({ ...p, documents: updated }));
    this.selectAll.set(false);
    this.isHeaderDropdownOpen.set(false);
  }

  toggleDocumentSelection(doc: PaymentTypeDocument): void {
    const updated = this.paymentType().documents.map(d => 
      d.id === doc.id ? { ...d, selected: !d.selected } : d
    );
    this.paymentType.update(p => ({ ...p, documents: updated }));
  }

  toggleDocumentActions(docId: string, event: Event): void {
    event.stopPropagation();
    if (this.activeDocActionId() === docId) {
      this.activeDocActionId.set(null);
    } else {
      this.activeDocActionId.set(docId);
    }
  }

  renameDocument(docId: string): void {
    const doc = this.paymentType().documents.find(d => d.id === docId);
    if (doc) {
      this.renameDocumentId.set(docId);
      this.renameValue.set(doc.name);
      this.isRenameModalOpen.set(true);
    }
    this.activeDocActionId.set(null);
  }

  downloadDocument(docId: string): void {
    const doc = this.paymentType().documents.find(d => d.id === docId);
    console.log('Download document:', doc);
    this.activeDocActionId.set(null);
  }

  deleteDocument(docId: string): void {
    const updated = this.paymentType().documents.filter(d => d.id !== docId);
    this.paymentType.update(p => ({ ...p, documents: updated }));
    this.activeDocActionId.set(null);
  }

  onRenameInputChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.renameValue.set(input.value);
  }

  confirmRename(): void {
    const docId = this.renameDocumentId();
    if (docId) {
      const updated = this.paymentType().documents.map(d => 
        d.id === docId ? { ...d, name: this.renameValue() } : d
      );
      this.paymentType.update(p => ({ ...p, documents: updated }));
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

