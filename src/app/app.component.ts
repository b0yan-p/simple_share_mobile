import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { App, URLOpenListenerEvent } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { distinctUntilChanged, filter, forkJoin, switchMap } from 'rxjs';
import { Router } from '@angular/router';
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
  private readonly router = inject(Router);
  private readonly online$ = toObservable(this.networkService.isOnline);

  ngOnInit(): void {
    void this.initStatusBar();
    void this.initDeepLinks();

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
   * Invite links are verified App Links, so Android hands the URL to the app
   * instead of a browser. Both entry points are needed: appUrlOpen covers a
   * link followed while the app is already running, and getLaunchUrl covers a
   * cold start, where the event has already fired by the time this listener is
   * registered.
   */
  private async initDeepLinks(): Promise<void> {
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    await App.addListener('appUrlOpen', (event: URLOpenListenerEvent) =>
      this.followDeepLink(event.url),
    );

    const launch = await App.getLaunchUrl();
    if (launch?.url) this.followDeepLink(launch.url);
  }

  /**
   * Only the path is used: the host is the API domain that verified the link,
   * and the path already matches an app route, so authGuard and its returnUrl
   * handling keep working untouched.
   */
  private followDeepLink(url: string): void {
    try {
      const { pathname, search } = new URL(url);
      void this.router.navigateByUrl(`${pathname}${search}`);
    } catch {
      // A malformed URL is nothing the app can act on.
    }
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
