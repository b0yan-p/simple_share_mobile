import { Directive, ElementRef, HostListener, inject, input } from '@angular/core';
import { finalize, Observable, take } from 'rxjs';
import { NetworkService } from '../../core/services/network.service';
import { ToastService } from '../../core/services/toast.service';

/**
 * Drives an <ion-refresher> from a factory that starts one refresh cycle.
 *
 * Usage:
 *   <ion-refresher slot="fixed" [appRefresh]="onRefresh">
 *     <ion-refresher-content />
 *   </ion-refresher>
 *
 * The bound member has to be an arrow property so `this` stays bound to the
 * component, and the observable it returns has to complete once the screen's
 * data has settled — that completion is what ends the spinner.
 */
@Directive({
  selector: 'ion-refresher[appRefresh]',
})
export class RefreshDirective {
  private readonly el = inject<ElementRef<HTMLIonRefresherElement>>(ElementRef);
  private readonly network = inject(NetworkService);
  private readonly toast = inject(ToastService);

  readonly refresh = input.required<() => Observable<unknown>>({ alias: 'appRefresh' });

  /** Guards against a second cycle starting while one is still in flight. */
  private inFlight = false;

  @HostListener('ionRefresh')
  onIonRefresh(): void {
    if (this.inFlight) {
      this.complete();
      return;
    }

    // Every loader early-returns when offline, so without this the observable
    // would settle without a request and the gesture would read as a no-op.
    // Say so instead, and never leave the spinner hanging.
    if (!this.network.isOnline()) {
      this.toast.infoToast("You're offline. Showing what we have.");
      this.complete();
      return;
    }

    this.inFlight = true;

    // Two steps on purpose: the signal holds the callback, and the callback
    // starts the cycle. `this.refresh()()` reads as a typo.
    const startRefresh = this.refresh();

    startRefresh()
      .pipe(
        take(1),
        finalize(() => {
          this.inFlight = false;
          this.complete();
        }),
      )
      .subscribe({
        // The facades toast their own failures; swallow here so an error still
        // ends the spinner rather than tearing the subscription down noisily.
        error: (err) => console.warn('[REFRESH]', err),
      });
  }

  private complete(): void {
    void this.el.nativeElement.complete();
  }
}
