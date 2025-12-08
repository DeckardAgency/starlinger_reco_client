import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { IconComponent } from '@shared/components/icon/icon.component';

@Component({
    selector: 'app-quick-actions',
    imports: [CommonModule, RouterModule, IconComponent],
    templateUrl: "quick-actions.component.html",
    styleUrls: ["quick-actions.component.scss"],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class QuickActionsComponent {
  // Placeholder for future quick actions
}
