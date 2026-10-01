import { Component, ChangeDetectionStrategy, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Component({
  selector: 'ui-section-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './section-header.component.html',
  styleUrls: ['./section-header.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SectionHeaderComponent {
  @Input({ required: true }) title!: string;
  @Input() icon?: string;
  @Input() viewAllLink?: string;
  @Input() viewAllLabel: string = 'View all';
  @Input() mobileViewAllLabel: string = 'All';

  constructor(private sanitizer: DomSanitizer) {}

  get sanitizedIcon(): SafeHtml | null {
    // Only inline SVG markup is accepted. Anything else (e.g. an icon NAME
    // passed by mistake) would be injected as literal text next to the title.
    const icon = this.icon?.trim();
    return icon && icon.startsWith('<svg')
      ? this.sanitizer.bypassSecurityTrustHtml(icon)
      : null;
  }
}
