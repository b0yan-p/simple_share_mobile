import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonSpinner,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';
import { ToastService } from 'src/app/core/services/toast.service';
import { AvatarComponent } from 'src/app/shared/components/avatar/avatar.component';
import { ExpenseDetail } from '../../models/expense.model';
import { ExpenseService } from '../../services/expense.service';
import { CURRENCY } from '../../utils/expense.constants';

@Component({
  selector: 'app-expense-detail',
  templateUrl: './expense-detail.component.html',
  styleUrls: ['./expense-detail.component.scss'],
  imports: [
    DatePipe,
    DecimalPipe,
    AvatarComponent,
    IonHeader,
    IonToolbar,
    IonButtons,
    IonBackButton,
    IonButton,
    IonTitle,
    IonContent,
    IonIcon,
    IonSpinner,
  ],
})
export class ExpenseDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private expenseService = inject(ExpenseService);
  private toastService = inject(ToastService);

  readonly currency = CURRENCY;
  expense = signal<ExpenseDetail | null>(null);
  loading = signal(true);
  groupId = '';
  expenseId = '';

  ngOnInit(): void {
    this.groupId = this.route.snapshot.params['id'];
    this.expenseId = this.route.snapshot.params['expenseId'];
    this.loadExpense(this.expenseId);
  }

  navigateToEdit(): void {
    this.router.navigate(['groups', this.groupId, 'expenses', this.expenseId]);
  }

  private loadExpense(expenseId: string): void {
    this.expenseService.getExpense(this.groupId, expenseId).subscribe({
      next: (data) => {
        this.expense.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.toastService.errorToast('Failed to load expense');
        this.loading.set(false);
      },
    });
  }
}
