import { Component, ChangeDetectionStrategy, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { IconComponent } from '@app/ui-kit/atoms/icon/icon.component';

@Component({
  selector: 'app-order-success',
  standalone: true,
  imports: [CommonModule, RouterModule, IconComponent],
  templateUrl: './order-success.component.html',
  styleUrls: ['./order-success.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OrderSuccessComponent implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  /** One number for a regular order; several when an agent checkout created one order per client. */
  orderNumbers = signal<string[]>(['STRL-0012XBA']);
  /** Shared reference of a multi-order (agent) checkout, when present. */
  checkoutReference = signal<string | null>(null);
  isMultiOrder = computed(() => this.orderNumbers().length > 1);
  orderNumber = computed(() => this.orderNumbers()[0] ?? '');

  ngOnInit(): void {
    // Agent checkout passes ?orderNumbers=STRL-1,STRL-2&checkoutReference=CHK-...;
    // the regular flow keeps passing ?orderNumber=...
    const params = this.route.snapshot.queryParamMap;
    const numbers = (params.get('orderNumbers') ?? params.get('orderNumber') ?? '')
      .split(',')
      .map(n => n.trim())
      .filter(n => n.length > 0);
    if (numbers.length > 0) {
      this.orderNumbers.set(numbers);
    }
    this.checkoutReference.set(params.get('checkoutReference'));
  }

  goToDashboard(): void {
    this.router.navigate(['/customer/dashboard']);
  }

  viewActiveInquiries(): void {
    this.router.navigate(['/customer/orders']);
  }

  callManager(): void {
    // In real app, this would trigger phone call
    console.log('Calling manager...');
  }

  emailManager(): void {
    // In real app, this would open email client
    window.location.href = 'mailto:john.doe@starlinger.com';
  }
}
