import { Component, ChangeDetectionStrategy, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ButtonComponent, BadgeComponent, SpinnerComponent } from '@app/ui-kit/atoms';
import { SectionHeaderComponent, EmptyStateComponent } from '@app/ui-kit/molecules';
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
    EmptyStateComponent
  ],
  templateUrl: './client-detail.component.html',
  styleUrls: ['./client-detail.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ClientDetailComponent implements OnInit {
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
