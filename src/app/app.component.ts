import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { distinctUntilChanged, filter, forkJoin, switchMap } from 'rxjs';
import { NetworkService } from './core/services/network.service';
import { ExpenseFacade } from './features/expenses/services/expense-facade.service';
import { ExpenseIdbService } from './features/expenses/services/expense-idb.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [IonApp, IonRouterOutlet],
})
export class AppComponent implements OnInit {
  private readonly networkService = inject(NetworkService);
  private readonly expenseIdb = inject(ExpenseIdbService);
  private readonly expenseFacade = inject(ExpenseFacade);
  private readonly destroyRef = inject(DestroyRef);
  private readonly online$ = toObservable(this.networkService.isOnline);

  ngOnInit(): void {
    forkJoin([this.networkService.initialize(), this.expenseIdb.initialize()])
      .pipe(
        switchMap(() => this.online$),
        distinctUntilChanged(),
        filter((isOnline) => isOnline),
        switchMap(() => this.expenseFacade.syncPendingExpenses()),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }
}
