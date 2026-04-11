import { Component, inject, OnInit } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { NetworkService } from './core/services/network.service';
import { ExpenseIdbService } from './features/expenses/services/expense-idb.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [IonApp, IonRouterOutlet],
})
export class AppComponent implements OnInit {
  private readonly networkService = inject(NetworkService);
  private readonly expenseIdb = inject(ExpenseIdbService);

  async ngOnInit(): Promise<void> {
    await Promise.all([
      this.networkService.initialize(),
      this.expenseIdb.initialize(),
    ]);
  }
}
