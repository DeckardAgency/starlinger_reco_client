import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Budget, BudgetService } from '@core/services/budget.service';
import { formatPrice } from '@utils/format-utils';

/**
 * Thin strip under the account notice: purchase limit, open payments and what is
 * left of the limit (like the old shop's top strip). Hidden when there is no limit;
 * for agents it shows the selected customer's figures.
 */
@Component({
  selector: 'app-budget-bar',
  templateUrl: './budget-bar.component.html',
  styleUrl: './budget-bar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BudgetBarComponent {
  private readonly budgetService = inject(BudgetService);

  readonly budget = this.budgetService.budget;

  /** "1.000,00 €" */
  format(amount: number): string {
    return formatPrice(amount, 'de-DE', 'EUR');
  }

  /** Fill of the progress bar, capped at 100%. */
  percent(budget: Budget): number {
    return Math.min(Math.round((budget.open / budget.limit) * 100), 100);
  }
}
