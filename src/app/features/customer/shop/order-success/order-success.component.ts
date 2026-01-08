import { Component, ChangeDetectionStrategy, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-order-success',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './order-success.component.html',
  styleUrls: ['./order-success.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OrderSuccessComponent implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  orderNumber = signal('STRL-0012XBA');
  areaManager = signal('mr. John Doe');

  ngOnInit(): void {
    // Get order number from query params if available
    const orderNum = this.route.snapshot.queryParamMap.get('orderNumber');
    if (orderNum) {
      this.orderNumber.set(orderNum);
    }
  }

  goToDashboard(): void {
    this.router.navigate(['/customer/dashboard']);
  }

  viewActiveInquiries(): void {
    this.router.navigate(['/customer/inquiries/active']);
  }

  callManager(): void {
    // In real app, this would trigger phone call
    console.log('Calling area manager...');
  }

  emailManager(): void {
    // In real app, this would open email client
    window.location.href = 'mailto:john.doe@starlinger.com';
  }
}

