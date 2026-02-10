import { Component, ChangeDetectionStrategy, ChangeDetectorRef, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BreadcrumbsComponent } from '@app/ui-kit/molecules/breadcrumbs/breadcrumbs.component';
import { BadgeComponent } from '@app/ui-kit/atoms/badge/badge.component';
import { ButtonComponent } from '@app/ui-kit/atoms/button/button.component';
import { IconComponent } from '@app/ui-kit/atoms/icon/icon.component';
import { InputComponent } from '@app/ui-kit/atoms/input/input.component';
import { DocumentationService } from '@core/services/http/documentation.service';
import { Documentation } from '@core/models/documentation.model';

@Component({
  selector: 'app-customer-admin-documentation',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    BreadcrumbsComponent,
    BadgeComponent,
    ButtonComponent,
    IconComponent,
    InputComponent
  ],
  templateUrl: './documentation.component.html',
  styleUrls: ['./documentation.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DocumentationComponent implements OnInit {
  private documentationService = inject(DocumentationService);
  private cdr = inject(ChangeDetectorRef);

  isLoading = signal(true);
  documents = signal<Documentation[]>([]);
  selectedDoc = signal<Documentation | null>(null);
  searchQuery = '';

  ngOnInit(): void {
    this.loadDocuments();
  }

  private loadDocuments(): void {
    this.isLoading.set(true);

    this.documentationService.getDocumentations(1, undefined, undefined, undefined, undefined, true).subscribe({
      next: (response) => {
        this.documents.set(response.documentations);
        this.isLoading.set(false);
        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error('Failed to load documentation:', error);
        this.isLoading.set(false);
        this.cdr.markForCheck();
      }
    });
  }

  onSearch(): void {
    this.isLoading.set(true);
    
    this.documentationService.getDocumentations(1, this.searchQuery || undefined, undefined, undefined, undefined, true).subscribe({
      next: (response) => {
        this.documents.set(response.documentations);
        this.isLoading.set(false);
        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error('Failed to search documentation:', error);
        this.isLoading.set(false);
        this.cdr.markForCheck();
      }
    });
  }

  onViewDoc(doc: Documentation): void {
    this.selectedDoc.set(doc);
  }

  onCloseDoc(): void {
    this.selectedDoc.set(null);
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  getCategoryLabel(category: string): string {
    return category || 'General';
  }

  getExcerpt(content: string, maxLength: number = 120): string {
    if (!content) return '';
    // Strip HTML tags
    const text = content.replace(/<[^>]*>/g, '');
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + '...';
  }
}
