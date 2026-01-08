import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { QuickActionsComponent } from '@shared/components/dashboard/quick-actions/quick-actions.component';
import { ActiveOrdersComponent } from '@shared/components/dashboard/active-orders/active-orders.component';
import { HistoryComponent } from '@shared/components/dashboard/history/history.component';

@Component({
  selector: 'app-dashboard',
  imports: [
    CommonModule,
    QuickActionsComponent,
    ActiveOrdersComponent,
    HistoryComponent
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardComponent {
  breadcrumbs = [
    { label: 'Dashboard' }
  ];
}
