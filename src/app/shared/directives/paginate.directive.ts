import {
  computed,
  Directive,
  effect,
  ElementRef,
  HostListener,
  inject,
  input,
} from '@angular/core';
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
    // complete() and the disabled write have to happen in this order, in one
    // effect. complete() resets didFire, which is what re-arms the scroll, and
    // Ionic guards it with `if (!this.isLoading) return` — while
    // disabledChanged() clears isLoading without touching didFire. Run them as
    // two separate reactions and the disabled write lands first on the last
    // page, complete() no-ops, and didFire stays true forever: the scroll then
    // stays dead even after a reload grows totalCount and re-enables it.
    effect(() => {
      const settled = !this.paginator().pageLoading();
      const disabled = this.disabled();

      if (settled) void this.el.nativeElement.complete();
      this.el.nativeElement.disabled = disabled;
    });
  }

  @HostListener('ionInfinite')
  onIonInfinite(): void {
    this.paginator().loadMoreData();
  }
}
