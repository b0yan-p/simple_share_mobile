import {
  afterRenderEffect,
  Component,
  computed,
  ElementRef,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { chevronBackOutline, chevronForwardOutline } from 'ionicons/icons';
import { getGroupCovers } from '../../models/group-cover-catalog';
import { GroupType } from '../../models/group-type.model';

@Component({
  selector: 'app-group-cover-picker',
  templateUrl: './group-cover-picker.component.html',
  styleUrl: './group-cover-picker.component.scss',
  imports: [IonIcon],
})
export class GroupCoverPickerComponent {
  readonly groupType = input.required<GroupType>();
  readonly value = input.required<string>();
  readonly valueChange = output<string>();

  protected readonly covers = computed(() => getGroupCovers(this.groupType()));
  protected readonly hasPrevious = signal(false);
  protected readonly hasNext = signal(false);
  private readonly strip = viewChild.required<ElementRef<HTMLElement>>('strip');

  constructor() {
    addIcons({ chevronBackOutline, chevronForwardOutline });

    afterRenderEffect((onCleanup) => {
      this.covers();
      this.value();
      const strip = this.strip().nativeElement;
      const selected = strip.querySelector<HTMLElement>('.is-selected');

      if (selected) {
        const bounds = strip.getBoundingClientRect();
        const item = selected.getBoundingClientRect();
        if (item.left < bounds.left) strip.scrollLeft += item.left - bounds.left;
        if (item.right > bounds.right) strip.scrollLeft += item.right - bounds.right;
      }

      this.updateScrollPosition(strip);
      const observer = new ResizeObserver(() => this.updateScrollPosition(strip));
      observer.observe(strip);
      onCleanup(() => observer.disconnect());
    });
  }

  protected select(key: string): void {
    if (key !== this.value()) this.valueChange.emit(key);
  }

  protected scrollCovers(direction: -1 | 1): void {
    const strip = this.strip().nativeElement;
    strip.scrollBy({
      left: direction * strip.clientWidth,
      behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
    });
  }

  protected updateScrollPosition(strip: HTMLElement): void {
    this.hasPrevious.set(strip.scrollLeft > 1);
    this.hasNext.set(strip.scrollWidth - strip.clientWidth - strip.scrollLeft > 1);
  }
}
