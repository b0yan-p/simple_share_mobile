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

  /** Position to restore when returning from another screen. */
  readonly scrollTop = signal(0);

  /** Opening a different group starts fresh; re-entering the same one keeps everything. */
  enter(groupId: string): void {
    if (this.groupId() === groupId) return;

    this.groupId.set(groupId);
    this.activeTab.set('overview');
    this.scrollTop.set(0);
  }
}
