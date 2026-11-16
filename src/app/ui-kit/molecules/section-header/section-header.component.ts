import { Component, ChangeDetectionStrategy, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { IconComponent } from '../../atoms/icon/icon.component';
import { ICON_REGISTRY } from '../../atoms/icon/icon-registry';

@Component({
  selector: 'ui-section-header',
  standalone: true,
  imports: [CommonModule, RouterModule, IconComponent],
  templateUrl: './section-header.component.html',
  styleUrls: ['./section-header.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SectionHeaderComponent {
  @Input({ required: true }) title!: string;
  /** Name of an icon in the ui-kit icon registry (e.g. 'file-check'). Raw markup is not accepted. */
  @Input() icon?: string;
  @Input() viewAllLink?: string;
  @Input() viewAllLabel: string = 'View all';
  @Input() mobileViewAllLabel: string = 'All';

  /**
   * The icon is rendered through <ui-icon>, i.e. only static markup from the icon
   * registry ever reaches the DOM. Unknown values (including inline SVG strings, which
   * this input used to trust) render nothing.
   */
  get iconName(): string | null {
    const icon = this.icon?.trim();
    return icon && Object.prototype.hasOwnProperty.call(ICON_REGISTRY, icon) ? icon : null;
  }
}
