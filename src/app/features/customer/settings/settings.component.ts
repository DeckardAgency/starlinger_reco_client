import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-customer-settings',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="settings-page">
      <h1>Settings</h1>
      <p>Customer settings page - Coming soon</p>
    </div>
  `,
  styles: [`
    .settings-page {
      padding: 24px;
      
      h1 {
        font-size: 24px;
        font-weight: 600;
        margin-bottom: 16px;
      }
      
      p {
        color: #6b7280;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SettingsComponent {}

