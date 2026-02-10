import { Component, ChangeDetectionStrategy, ChangeDetectorRef, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BreadcrumbsComponent } from '@app/ui-kit/molecules/breadcrumbs/breadcrumbs.component';
import { ButtonComponent } from '@app/ui-kit/atoms/button/button.component';
import { InputComponent } from '@app/ui-kit/atoms/input/input.component';
import { IconComponent } from '@app/ui-kit/atoms/icon/icon.component';
import { FormFieldComponent } from '@app/ui-kit/molecules';
import { ClientService } from '@core/services/http/client.service';
import { AuthService } from '@core/auth/auth.service';
import { ClientDetail } from '@core/models/client.model';

@Component({
  selector: 'app-customer-admin-company',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    BreadcrumbsComponent,
    ButtonComponent,
    InputComponent,
    IconComponent,
    FormFieldComponent
  ],
  templateUrl: './company.component.html',
  styleUrls: ['./company.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CompanyComponent implements OnInit {
  private clientService = inject(ClientService);
  private authService = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);

  isLoading = signal(true);
  isEditing = signal(false);
  isSaving = signal(false);
  client = signal<ClientDetail | null>(null);

  // Form data for editing
  formData = {
    name: '',
    email: '',
    phoneNumber: '',
    address: '',
    vatNumber: '',
    description: ''
  };

  ngOnInit(): void {
    this.loadClientData();
  }

  private loadClientData(): void {
    this.isLoading.set(true);

    const currentUser = this.authService.getCurrentUser();
    const clientCode = currentUser?.client?.code;

    if (!clientCode) {
      console.error('No client code found for current user');
      this.isLoading.set(false);
      this.cdr.markForCheck();
      return;
    }

    this.clientService.getClientByCode(clientCode).subscribe({
      next: (client) => {
        if (client) {
          // Fetch full client details
          this.clientService.getClient(client.id).subscribe({
            next: (clientDetail) => {
              this.client.set(clientDetail);
              this.populateForm(clientDetail);
              this.isLoading.set(false);
              this.cdr.markForCheck();
            },
            error: (error) => {
              console.error('Failed to load client details:', error);
              this.isLoading.set(false);
              this.cdr.markForCheck();
            }
          });
        } else {
          this.isLoading.set(false);
          this.cdr.markForCheck();
        }
      },
      error: (error) => {
        console.error('Failed to load client:', error);
        this.isLoading.set(false);
        this.cdr.markForCheck();
      }
    });
  }

  private populateForm(client: ClientDetail): void {
    this.formData = {
      name: client.name || '',
      email: client.email || '',
      phoneNumber: client.phoneNumber || '',
      address: client.address || '',
      vatNumber: client.vatNumber || '',
      description: client.description || ''
    };
  }

  onEdit(): void {
    this.isEditing.set(true);
  }

  onCancel(): void {
    const client = this.client();
    if (client) {
      this.populateForm(client);
    }
    this.isEditing.set(false);
  }

  onSave(): void {
    const client = this.client();
    if (!client) return;

    this.isSaving.set(true);

    this.clientService.updateClient(client.id, {
      name: this.formData.name,
      email: this.formData.email,
      phoneNumber: this.formData.phoneNumber,
      address: this.formData.address,
      vatNumber: this.formData.vatNumber,
      description: this.formData.description
    }).subscribe({
      next: (updatedClient) => {
        this.client.set({ ...client, ...updatedClient });
        this.isEditing.set(false);
        this.isSaving.set(false);
        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error('Failed to update client:', error);
        this.isSaving.set(false);
        this.cdr.markForCheck();
      }
    });
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }
}
