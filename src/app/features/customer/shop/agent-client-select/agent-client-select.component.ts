import {
  Component,
  ChangeDetectionStrategy,
  OnInit,
  inject,
  signal,
  output,
  ElementRef,
  HostListener,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { AgentService, ManagedClientResponse } from '@core/services/http/agent.service';
import { AgentClientSelectionService } from '@core/services/agent-client-selection.service';

/**
 * In-shop "Choose client(s)" dropdown for client agents. Loads the agent's
 * managed clients and drives the shared AgentClientSelectionService so the rest
 * of the shop/checkout flow knows who the agent is ordering on behalf of.
 *
 * Visual matches the InqTool control: a "Select" trigger with a chevron and a
 * panel of rows (checkbox + client name on the left, client code on the right).
 * Selection is single-active — picking a client sets it as the on-behalf client;
 * picking it again clears it. The agent builds a multi-client cart by switching
 * the active client between adds.
 */
@Component({
  selector: 'app-agent-client-select',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './agent-client-select.component.html',
  styleUrls: ['./agent-client-select.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AgentClientSelectComponent implements OnInit {
  private agentService = inject(AgentService);
  private selection = inject(AgentClientSelectionService);
  private host = inject(ElementRef<HTMLElement>);

  /** Emitted whenever the active client changes (null when cleared). */
  selectionChange = output<ManagedClientResponse | null>();

  clients = signal<ManagedClientResponse[]>([]);
  selected = signal<ManagedClientResponse | null>(this.selection.getSelectedClient());
  open = signal(false);

  ngOnInit(): void {
    this.agentService.getManagedClients().subscribe({
      next: (res) => {
        const list = res.member ?? [];
        this.clients.set(list);
        // Drop a stale cached selection that is no longer managed.
        this.selection.validateAgainstList(list);
        this.selected.set(this.selection.getSelectedClient());
      },
      error: (err) => console.error('Failed to load managed clients:', err),
    });
  }

  toggle(): void {
    this.open.update((v) => !v);
  }

  isSelected(client: ManagedClientResponse): boolean {
    return this.selected()?.id === client.id;
  }

  choose(client: ManagedClientResponse): void {
    if (this.isSelected(client)) {
      this.selection.clearSelection();
      this.selected.set(null);
      this.selectionChange.emit(null);
    } else {
      this.selection.selectClient(client);
      this.selected.set(client);
      this.selectionChange.emit(client);
    }
    this.open.set(false);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (this.open() && !this.host.nativeElement.contains(event.target as Node)) {
      this.open.set(false);
    }
  }
}
