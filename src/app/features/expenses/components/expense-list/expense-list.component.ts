import { DatePipe, DecimalPipe, NgClass } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Params, Router } from '@angular/router';
import {
  IonAlert,
  IonIcon,
  IonItem,
  IonItemOption,
  IonItemOptions,
  IonItemSliding,
  IonList,
  ViewWillEnter,
} from '@ionic/angular/standalone';
import { distinctUntilChanged, map, Observable } from 'rxjs';
import { ToastService } from 'src/app/core/services/toast.service';
import { AvatarComponent } from 'src/app/shared/components/avatar/avatar.component';
import { PaginatorComponent } from 'src/app/shared/components/paginator/paginator.component';
import { ExpenseFacade } from '../../services/expense-facade.service';
import { ExpensePaginatorService } from '../../services/expense-paginator.service';

@Component({
  selector: 'app-expense-list',
  templateUrl: './expense-list.component.html',
  styleUrls: ['./expense-list.component.scss'],
  imports: [
    NgClass,
    DatePipe,
    DecimalPipe,
    IonList,
    IonItem,
    IonItemSliding,
    IonItemOptions,
    IonItemOption,
    IonIcon,
    IonAlert,
    AvatarComponent,
    PaginatorComponent,
  ],
})
export class ExpenseListComponent implements OnInit {
  route = inject(ActivatedRoute);
  router = inject(Router);
  facade = inject(ExpenseFacade);
  toastService = inject(ToastService);
  paginator = inject(ExpensePaginatorService);

  pendingDeleteId = '';
  isDeleteAlertOpen = false;

  routeParams$?: Observable<string>;

  alertButtons = [
    { text: 'Cancel', role: 'cancel' },
    {
      text: 'Delete',
      role: 'confirm',
      cssClass: 'delete-confirmation',
      handler: () => this.confirmDelete(),
    },
  ];

  constructor() {
    console.log('EXPENSE COMPONENT');

    this.routeParams$ = this.route.params.pipe(
      map((p) => p['id']),
      takeUntilDestroyed(),
    );
  }

  ngOnInit(): void {
    this.routeParams$?.subscribe((groupId) => this.facade.loadExpenses(groupId));
  }

  navigateToDetail(expenseId: string): void {
    const groupId = this.route.snapshot.params['id'];
    this.router.navigate(['groups', groupId, 'expenses', expenseId, 'details']);
  }

  navigateToEdit(expenseId: string): void {
    const groupId = this.route.snapshot.params['id'];
    this.router.navigate(['groups', groupId, 'expenses', expenseId]);
  }

  openDeleteAlert(expenseId: string): void {
    this.pendingDeleteId = expenseId;
    this.isDeleteAlertOpen = true;
  }

  private confirmDelete(): void {
    const groupId = this.route.snapshot.params['id'];
    this.facade.deleteExpense(groupId, this.pendingDeleteId).subscribe({
      next: () => {
        this.toastService.successToast('Expense deleted');
        // TODO instead of reloading the whole list we should just remove the deleted expense from the state and from database
        this.facade.loadExpenses(groupId);
      },
      error: () => this.toastService.errorToast('Failed to delete expense'),
    });
  }
}
