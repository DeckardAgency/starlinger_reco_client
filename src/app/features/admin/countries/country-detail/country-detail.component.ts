import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, signal, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { FormFieldComponent } from '@app/ui-kit/molecules/form-field/form-field.component';
import { Country, DHL_ZONES, DhlZone } from '@core/models/country.model';

interface CountryDetail {
  id: string;
  name: string;
  code: string;
  iso31661Alpha3Code: string;
  dhlZone: string;
  defaultTaxPercent: number;
}

const EMPTY_COUNTRY: CountryDetail = {
  id: '',
  name: '',
  code: '',
  iso31661Alpha3Code: '',
  dhlZone: '',
  defaultTaxPercent: 0
};

@Component({
  selector: 'app-country-detail',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    FormFieldComponent
  ],
  templateUrl: './country-detail.component.html',
  styleUrls: ['./country-detail.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CountryDetailComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private countryId: string | null = null;

  // Form state
  country = signal<CountryDetail>({ ...EMPTY_COUNTRY });
  isEditMode = signal(false);
  isLoading = signal(false);

  // DHL zone options
  dhlZoneOptions: DhlZone[] = DHL_ZONES;

  // Selected DHL zone for the select-with-pill
  selectedDhlZone = '';

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe(params => {
      this.countryId = params['id'] || null;
      this.isEditMode.set(!!this.countryId && this.countryId !== 'new');
      
      if (this.isEditMode()) {
        this.loadCountry(this.countryId!);
      } else {
        this.country.set({ ...EMPTY_COUNTRY });
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadCountry(id: string): void {
    this.isLoading.set(true);
    
    // Mock data - in real app this would be an API call
    setTimeout(() => {
      this.country.set({
        id: id,
        name: 'Afghanistan',
        code: 'AF',
        iso31661Alpha3Code: '-',
        dhlZone: 'zone8',
        defaultTaxPercent: 0
      });
      this.isLoading.set(false);
      this.cdr.markForCheck();
    }, 100);
  }

  // Navigation
  goBack(): void {
    this.router.navigate(['/admin/countries']);
  }

  // Form handlers
  onNameChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.country.update(c => ({ ...c, name: value }));
  }

  onCodeChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.country.update(c => ({ ...c, code: value }));
  }

  onIso31661Alpha3CodeChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.country.update(c => ({ ...c, iso31661Alpha3Code: value }));
  }

  onDefaultTaxPercentChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.country.update(c => ({ ...c, defaultTaxPercent: parseFloat(value) || 0 }));
  }

  onDhlZoneChange(): void {
    if (this.selectedDhlZone) {
      this.country.update(c => ({ ...c, dhlZone: this.selectedDhlZone }));
    }
  }

  removeDhlZone(): void {
    this.country.update(c => ({ ...c, dhlZone: '' }));
    this.selectedDhlZone = '';
  }

  getDhlZoneLabel(value: string): string {
    return this.dhlZoneOptions.find(o => o.value === value)?.label || value;
  }

  // Save actions
  onSave(): void {
    console.log('Saving country:', this.country());
    this.router.navigate(['/admin/countries']);
  }

  onSaveAndContinue(): void {
    console.log('Save and continue:', this.country());
  }
}

