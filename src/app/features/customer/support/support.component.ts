import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-customer-support',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="support-page">
      <h1>Support</h1>
      <p>Customer support page - Coming soon</p>
    </div>
  `,
  styles: [`
    .support-page {
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
export class SupportComponent {}

