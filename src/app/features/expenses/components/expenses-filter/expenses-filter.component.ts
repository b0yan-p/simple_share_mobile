import { Component, model } from '@angular/core';
import { IonIcon } from '@ionic/angular/standalone';
import { ExpenseFilter } from '../../models/expense-list-item.model';

@Component({
  selector: 'app-expenses-filter',
  templateUrl: './expenses-filter.component.html',
  styleUrls: ['./expenses-filter.component.scss'],
  imports: [IonIcon],
})
export class ExpensesFilterComponent {
  /** Currently active filter — two-way bindable via [(value)]. */
  readonly value = model<ExpenseFilter>('all');

  select(filter: ExpenseFilter): void {
    this.value.set(filter);
  }
}
