import { Component, ChangeDetectionStrategy, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ButtonComponent, BadgeComponent, SpinnerComponent } from '@app/ui-kit/atoms';
import { SectionHeaderComponent, EmptyStateComponent } from '@app/ui-kit/molecules';
import { BreadcrumbsComponent, BreadcrumbItem } from '@app/ui-kit/molecules/breadcrumbs/breadcrumbs.component';
import { AgentService, ManagedClientResponse } from '@core/services/http/agent.service';
import { AgentClientSelectionService } from '@core/services/agent-client-selection.service';

/**
 * Read-only detail view for a single managed client. The agent endpoint only
 * exposes the collection, so we fetch it and resolve the requested id locally.
 */
@Component({
  selector: 'app-client-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ButtonComponent,
    BadgeComponent,
    SpinnerComponent,
    SectionHeaderComponent,
    EmptyStateComponent,
    BreadcrumbsComponent
  ],
  templateUrl: './client-detail.component.html',
  styleUrls: ['./client-detail.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ClientDetailComponent implements OnInit {
  breadcrumbItems: BreadcrumbItem[] = [
    { label: 'My Clients', route: '/customer/my-clients' },
    { label: 'Client details' }
  ];

  // Inline SVG (ui-section-header renders raw SVG markup, not icon names)
  readonly userIcon = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M13.333 14v-1.333A2.667 2.667 0 0 0 10.667 10H5.333a2.667 2.667 0 0 0-2.666 2.667V14M8 7.333A2.667 2.667 0 1 0 8 2a2.667 2.667 0 0 0 0 5.333Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

  private agentService = inject(AgentService);
  private selection = inject(AgentClientSelectionService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  client = signal<ManagedClientResponse | null>(null);
  isLoading = signal(true);
  notFound = signal(false);
  error = signal<string | null>(null);

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) {
      this.notFound.set(true);
      this.isLoading.set(false);
      return;
    }
    this.load(id);
  }

  private load(id: number): void {
    this.isLoading.set(true);
    this.error.set(null);
    this.notFound.set(false);

    this.agentService.getManagedClients().subscribe({
      next: (res) => {
        const match = (res.member ?? []).find(c => c.id === id) ?? null;
        this.client.set(match);
        this.notFound.set(match === null);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load client detail:', err);
        this.error.set('Failed to load this client. Please try again.');
        this.isLoading.set(false);
      }
    });
  }

  isSelected(): boolean {
    const c = this.client();
    return !!c && this.selection.getSelectedClient()?.id === c.id;
  }

  selectAndShop(): void {
    const c = this.client();
    if (!c) {
      return;
    }
    this.selection.selectClient(c);
    this.router.navigate(['/customer/shop/products']);
  }

  back(): void {
    this.router.navigate(['/customer/my-clients']);
  }
}
