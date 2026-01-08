import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-search',
    standalone: true,
    imports: [CommonModule],
    template: `
        <div class="page">
            <div class="page__header">
                <h1>Search</h1>
                <p>Search for parts and products</p>
            </div>
            <div class="page__content">
                <p>Search functionality coming soon...</p>
            </div>
        </div>
    `,
    styles: [`
        .page {
            padding: 1.5rem;
            &__header {
                margin-bottom: 1.5rem;
                h1 { font-size: 1.5rem; font-weight: 600; margin: 0 0 0.5rem; }
                p { color: #6b7280; margin: 0; }
            }
            &__content {
                background: white;
                border: 1px solid #e5e7eb;
                border-radius: 12px;
                padding: 2rem;
            }
        }
    `]
})
export class SearchComponent {}

