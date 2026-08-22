import {
  computed,
  Directive,
  effect,
  ElementRef,
  HostListener,
  inject,
  input,
} from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs';
import { PaginatorService } from '../../core/services/paginator.service';

/**
 * Drives an <ion-infinite-scroll> from a PaginatorService.
 *
 * Usage:
 *   <ion-infinite-scroll [appPaginate]="paginator">
 *     <ion-infinite-scroll-content />
 *   </ion-infinite-scroll>
 */
@Directive({
  selector: 'ion-infinite-scroll[appPaginate]',
})
export class PaginateDirective {
  private readonly el = inject<ElementRef<HTMLIonInfiniteScrollElement>>(ElementRef);

  readonly paginator = input.required<PaginatorService>({ alias: 'appPaginate' });

  /**
   * Never disable while a page is in flight. Ionic's disabledChanged() drops
   * isLoading without resetting didFire, which would make the following
   * complete() a no-op and leave the scroll permanently stuck. hasMoreData()
   * alone is not safe here: loadMoreData() advances skip optimistically, so on
   * the last page it flips to false mid-request.
   */
  readonly disabled = computed(
    () => !this.paginator().pageLoading() && !this.paginator().hasMoreData(),
  );

  constructor() {
    effect(() => {
      this.el.nativeElement.disabled = this.disabled();
    });

    // complete() resets didFire, which is what re-arms the scroll, and it ends
    // the window during which Ionic shows its loading indicator. Ionic guards
    // it with `if (!this.isLoading) return`, so calling it whenever a page
    // settles is a no-op unless one was actually in flight.
    toObservable(computed(() => this.paginator().pageLoading()))
      .pipe(
        filter((loading) => !loading),
        takeUntilDestroyed(),
      )
      .subscribe(() => this.el.nativeElement.complete());
  }

  @HostListener('ionInfinite')
  onIonInfinite(): void {
    this.paginator().loadMoreData();
  }
}
