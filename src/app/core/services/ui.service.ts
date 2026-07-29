import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class UiService {
  itemLoading = signal<boolean>(false);
  listLoading = signal<boolean>(false);

  /** Toggled off by focused flows (e.g. the expense wizard) to hide the bottom tab bar. */
  tabBarVisible = signal<boolean>(true);
}
