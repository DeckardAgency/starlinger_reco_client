import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { QuickActionsComponent } from '@shared/components/dashboard/quick-actions/quick-actions.component';

@Component({
    selector: 'app-dashboard',
  imports: [
    CommonModule,
    QuickActionsComponent
  ],
    templateUrl: "dashboard.component.html",
    styleUrls: ['./dashboard.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardComponent {
  breadcrumbs = [
    { label: 'Dashboard' }
  ];
}
