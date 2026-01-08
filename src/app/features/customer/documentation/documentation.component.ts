import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-customer-documentation',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="documentation-page">
      <h1>Documentation</h1>
      <p>Customer documentation page - Coming soon</p>
    </div>
  `,
  styles: [`
    .documentation-page {
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
export class DocumentationComponent {}

