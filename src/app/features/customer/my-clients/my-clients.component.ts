import { Component, ChangeDetectionStrategy, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { ButtonComponent, BadgeComponent, SpinnerComponent, IconComponent } from '@app/ui-kit/atoms';
import { SectionHeaderComponent, EmptyStateComponent } from '@app/ui-kit/molecules';
import { AgentService, ManagedClientResponse } from '@core/services/http/agent.service';
import { AgentClientSelectionService } from '@core/services/agent-client-selection.service';

/**
 * Client-agent landing page: lists the clients this agent company manages and
 * lets the agent pick the one they're ordering on behalf of.
 */
@Component({
  selector: 'app-my-clients',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ButtonComponent,
    BadgeComponent,
    SpinnerComponent,
    IconComponent,
    SectionHeaderComponent,
    EmptyStateComponent
  ],
  templateUrl: './my-clients.component.html',
  styleUrls: ['./my-clients.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MyClientsComponent implements OnInit {
  private agentService = inject(AgentService);
  private selection = inject(AgentClientSelectionService);
  private router = inject(Router);

  clients = signal<ManagedClientResponse[]>([]);
  isLoading = signal(true);
  error = signal<string | null>(null);
  selectedClientId = signal<number | null>(this.selection.getSelectedClient()?.id ?? null);

  ngOnInit(): void {
    this.load();
  }

  private load(): void {
    this.isLoading.set(true);
    this.error.set(null);

    this.agentService.getManagedClients().subscribe({
      next: (res) => {
        const list = res.member ?? [];
        this.clients.set(list);
        // Drop a stale cached selection if it's no longer managed
        this.selection.validateAgainstList(list);
        this.selectedClientId.set(this.selection.getSelectedClient()?.id ?? null);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load managed clients:', err);
        this.error.set('Failed to load your clients. Please try again.');
        this.isLoading.set(false);
      }
    });
  }

  retry(): void {
    this.load();
  }

  isSelected(client: ManagedClientResponse): boolean {
    return this.selectedClientId() === client.id;
  }

  selectClient(client: ManagedClientResponse): void {
    this.selection.selectClient(client);
    this.selectedClientId.set(client.id);
  }

  selectAndShop(client: ManagedClientResponse): void {
    this.selectClient(client);
    this.router.navigate(['/customer/shop/products']);
  }

  clearSelection(): void {
    this.selection.clearSelection();
    this.selectedClientId.set(null);
  }

  viewClient(client: ManagedClientResponse): void {
    this.router.navigate(['/customer/my-clients', client.id, 'view']);
  }

  selectedClientName(): string {
    return this.selection.getSelectedClient()?.name ?? '';
  }
}
