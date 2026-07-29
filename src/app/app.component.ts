import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { distinctUntilChanged, filter, forkJoin, switchMap } from 'rxjs';
import { NetworkService } from './core/services/network.service';
import { SimpleShareIdbService } from './core/services/simpleshare-idb.service';
import { ExpenseFacade } from './features/expenses/services/expense-facade.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [IonApp, IonRouterOutlet],
})
export class AppComponent implements OnInit {
  private readonly networkService = inject(NetworkService);
  private readonly idb = inject(SimpleShareIdbService);
  private readonly expenseFacade = inject(ExpenseFacade);
  private readonly destroyRef = inject(DestroyRef);
  private readonly online$ = toObservable(this.networkService.isOnline);

  ngOnInit(): void {
    void this.initStatusBar();

    forkJoin([this.networkService.initialize(), this.idb.initialize()])
      .pipe(
        switchMap(() => this.online$),
        distinctUntilChanged(),
        filter((isOnline) => isOnline),
        switchMap(() => this.expenseFacade.syncPendingExpenses()),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  /**
   * The app UI is always light, so force dark status bar icons/text. Without
   * this, a phone in dark mode uses light (white) icons that are invisible on
   * our light background. Style.Light = dark content for light backgrounds.
   */
  private async initStatusBar(): Promise<void> {
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    try {
      await StatusBar.setStyle({ style: Style.Light });
    } catch {
      // StatusBar is unavailable on some platforms; safe to ignore.
    }
  }
}
