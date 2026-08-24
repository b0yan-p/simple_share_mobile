import { Injectable, signal } from '@angular/core';

export type GroupDetailTab = 'overview' | 'expenses' | 'balance';

/**
 * View state of the group detail screen. Root-provided so it outlives the
 * wrapper component, which is what lets a return from an expense detail land on
 * the tab and scroll offset the user left from.
 */
@Injectable({
  providedIn: 'root',
})
export class GroupDetailStore {
  readonly groupId = signal<string | null>(null);
  readonly activeTab = signal<GroupDetailTab>('overview');

  /** scrollTop of the shared ion-content, kept per tab. */
  private readonly scrollTops = signal<Partial<Record<GroupDetailTab, number>>>({});

  /** Opening a different group starts fresh; re-entering the same one keeps everything. */
  enter(groupId: string): void {
    if (this.groupId() === groupId) return;

    this.groupId.set(groupId);
    this.activeTab.set('overview');
    this.scrollTops.set({});
  }

  scrollTopFor(tab: GroupDetailTab): number {
    return this.scrollTops()[tab] ?? 0;
  }

  setScrollTop(tab: GroupDetailTab, value: number): void {
    this.scrollTops.update((current) => ({ ...current, [tab]: value }));
  }
}
