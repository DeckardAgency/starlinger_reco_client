import { Component, ChangeDetectionStrategy, ChangeDetectorRef, OnInit, HostListener, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BreadcrumbsComponent } from '@app/ui-kit/molecules/breadcrumbs/breadcrumbs.component';
import { BadgeComponent } from '@app/ui-kit/atoms/badge/badge.component';
import { ButtonComponent } from '@app/ui-kit/atoms/button/button.component';
import { IconComponent } from '@app/ui-kit/atoms/icon/icon.component';
import { DrawerComponent } from '@app/ui-kit/organisms/drawer/drawer.component';
import { FormFieldComponent } from '@app/ui-kit/molecules';
import { InputComponent } from '@app/ui-kit/atoms/input/input.component';
import { SelectComponent } from '@app/ui-kit/atoms/select/select.component';
import { SupportTicketService } from '@core/services/http/support-ticket.service';
import { SupportTicket } from '@core/models/support-ticket.model';

@Component({
  selector: 'app-customer-support',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    BreadcrumbsComponent,
    BadgeComponent,
    ButtonComponent,
    IconComponent,
    DrawerComponent,
    FormFieldComponent,
    InputComponent,
    SelectComponent
  ],
  templateUrl: './support.component.html',
  styleUrls: ['./support.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SupportComponent implements OnInit {
  private supportTicketService = inject(SupportTicketService);
  private cdr = inject(ChangeDetectorRef);

  isLoading = signal(true);
  tickets = signal<SupportTicket[]>([]);
  showCreateDrawer = signal(false);
  selectedTicket = signal<SupportTicket | null>(null);

  // Form data for new ticket
  formData = {
    subject: '',
    message: '',
    urgency: 'medium' as 'low' | 'medium' | 'high'
  };

  urgencyOptions = [
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' }
  ];

  ngOnInit(): void {
    this.loadTickets();
  }

  private loadTickets(): void {
    this.isLoading.set(true);

    this.supportTicketService.getSupportTickets().subscribe({
      next: (response) => {
        this.tickets.set(response.tickets);
        this.isLoading.set(false);
        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error('Failed to load support tickets:', error);
        this.isLoading.set(false);
        this.cdr.markForCheck();
      }
    });
  }

  onCreateTicket(): void {
    this.resetForm();
    this.showCreateDrawer.set(true);
  }

  onCloseDrawer(): void {
    this.showCreateDrawer.set(false);
    this.selectedTicket.set(null);
    this.resetForm();
  }

  onViewTicket(ticket: SupportTicket): void {
    // Show immediately with the list data, then refresh from the server so a
    // status change made elsewhere (e.g. by an admin) is reflected.
    this.selectedTicket.set(ticket);
    this.supportTicketService.getSupportTicketById(String(ticket.id)).subscribe({
      next: (fresh) => {
        this.selectedTicket.set(fresh);
        this.tickets.update(list => list.map(t => t.id === fresh.id ? fresh : t));
        this.cdr.markForCheck();
      },
      error: () => { /* keep the list version if the refresh fails */ }
    });
  }

  // Re-sync the list when the customer returns to the tab, so status changes
  // made in the admin app show up without a manual full-page refresh.
  @HostListener('window:focus')
  onWindowFocus(): void {
    this.loadTickets();
  }

  onCloseDetail(): void {
    this.selectedTicket.set(null);
  }

  onSubmitTicket(): void {
    const ticketData = {
      subject: this.formData.subject,
      message: this.formData.message,
      urgency: this.formData.urgency,
      status: 'open' as const
    };

    this.supportTicketService.createSupportTicket(ticketData).subscribe({
      next: (newTicket) => {
        this.tickets.update(tickets => [newTicket, ...tickets]);
        this.onCloseDrawer();
        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error('Failed to create support ticket:', error);
      }
    });
  }

  private resetForm(): void {
    this.formData = {
      subject: '',
      message: '',
      urgency: 'medium'
    };
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'open': return 'Open';
      case 'in_progress': return 'In Progress';
      case 'resolved': return 'Resolved';
      case 'closed': return 'Closed';
      default: return status;
    }
  }

  getStatusVariant(status: string): 'success' | 'warning' | 'info' | 'secondary' {
    switch (status) {
      case 'open': return 'info';
      case 'in_progress': return 'warning';
      case 'resolved': return 'success';
      case 'closed': return 'secondary';
      default: return 'secondary';
    }
  }

  getUrgencyLabel(urgency: string): string {
    return urgency.charAt(0).toUpperCase() + urgency.slice(1);
  }

  getUrgencyVariant(urgency: string): 'success' | 'warning' | 'danger' {
    switch (urgency) {
      case 'low': return 'success';
      case 'medium': return 'warning';
      case 'high': return 'danger';
      default: return 'warning';
    }
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
