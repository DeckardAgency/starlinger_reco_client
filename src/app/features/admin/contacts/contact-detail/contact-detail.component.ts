import { Component, ChangeDetectionStrategy, ChangeDetectorRef, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

import { ToggleComponent } from '@app/ui-kit/atoms/toggle/toggle.component';
import { FormFieldComponent } from '@app/ui-kit/molecules/form-field/form-field.component';

// Contact detail interface
interface ContactDetail {
  id: number | null;
  firstName: string;
  lastName: string;
  account: string;
  accountId?: number;
  personTitle?: string;
  department?: string;
  dateOfBirth?: string;
  supportLevel?: string;
  supportPerson?: string;
  phone?: string;
  otherPhone?: string;
  homePhone?: string;
  email: string;
  otherEmail?: string;
  fax?: string;
  isBilling: boolean;
  isActive: boolean;
}

// Default empty contact for new mode
const EMPTY_CONTACT: ContactDetail = {
  id: null,
  firstName: '',
  lastName: '',
  account: '',
  personTitle: '',
  department: '',
  dateOfBirth: '',
  supportLevel: '',
  supportPerson: '',
  phone: '',
  otherPhone: '',
  homePhone: '',
  email: '',
  otherEmail: '',
  fax: '',
  isBilling: false,
  isActive: true
};

@Component({
  selector: 'app-contact-detail',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    ToggleComponent,
    FormFieldComponent
  ],
  templateUrl: './contact-detail.component.html',
  styleUrls: ['./contact-detail.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ContactDetailComponent implements OnInit, OnDestroy {
  private cdr = inject(ChangeDetectorRef);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private location = inject(Location);
  private destroy$ = new Subject<void>();

  // Mode tracking
  isEditMode = signal(false);

  // Contact data - starts empty
  contact = signal<ContactDetail>({ ...EMPTY_CONTACT });

  isBilling = signal(false);
  isActive = signal(true);

  ngOnInit(): void {
    // Subscribe to route param changes to handle navigation between add/edit
    this.route.paramMap
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        const contactId = params.get('id');
        if (contactId && contactId !== 'new') {
          this.isEditMode.set(true);
          this.loadContact(+contactId);
        } else {
          // New contact mode - reset to empty state
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
    this.contact.set({ ...EMPTY_CONTACT });
    this.isBilling.set(false);
    this.isActive.set(true);
    this.cdr.markForCheck();
  }

  private loadContact(id: number): void {
    // In a real app, this would be an API call
    // For now, use mock data
    this.contact.set({
      id,
      firstName: 'Alexander',
      lastName: 'Pas',
      account: 'Account name',
      personTitle: 'Mr.',
      department: 'Finance',
      dateOfBirth: '',
      supportLevel: '',
      supportPerson: '',
      phone: '0048544735352',
      otherPhone: '',
      homePhone: '',
      email: 'name@company.com',
      otherEmail: '',
      fax: '',
      isBilling: true,
      isActive: true
    });
    this.isBilling.set(true);
    this.isActive.set(true);
    this.cdr.markForCheck();
  }

  goBack(): void {
    this.location.back();
  }

  onBillingChange(checked: boolean): void {
    this.isBilling.set(checked);
  }

  onActiveChange(checked: boolean): void {
    this.isActive.set(checked);
  }

  onSaveAndContinue(): void {
    console.log('Save and continue:', this.contact());
    // Navigate to next contact or stay on page
  }

  onSave(): void {
    console.log('Save contact:', this.contact());
    this.router.navigate(['/admin/contacts']);
  }

  formatValue(value: string | undefined | null): string {
    return value || '–';
  }
}

