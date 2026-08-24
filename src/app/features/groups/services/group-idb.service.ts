import { inject, Injectable } from '@angular/core';
import { from, map, Observable } from 'rxjs';
import { SimpleShareIdbService } from 'src/app/core/services/simpleshare-idb.service';
import { GroupOverview } from '../models/group-overview.model';
import { GroupListItem } from '../models/group.model';

/** The group list is not scoped to anything, so the whole cache is one record. */
export const GROUPS_CACHE_KEY = 'all';

/** Recent groups share the 'groups' store with the full list, but as their own record. */
export const RECENT_GROUPS_CACHE_KEY = 'recent';

@Injectable({
  providedIn: 'root',
})
export class GroupIdbService {
  private readonly idb = inject(SimpleShareIdbService);
  private readonly storeName = 'groups';
  private readonly overviewStoreName = 'group_overview';

  saveGroups(totalCount: number, items: GroupListItem[]): Observable<void> {
    return from(
      this.idb.db.put(
        this.storeName,
        { items, totalCount, cachedAt: new Date().toISOString() },
        GROUPS_CACHE_KEY,
      ),
    ).pipe(map(() => void 0));
  }

  getGroups(): Observable<{ items: GroupListItem[]; totalCount: number } | null> {
    return from(this.idb.db.get(this.storeName, GROUPS_CACHE_KEY)).pipe(
      map((entry) => (entry ? { items: entry.items, totalCount: entry.totalCount } : null)),
    );
  }

  /**
   * `/group/recent` returns a flat array with no server-side totalCount, so the
   * entry's totalCount is just the item count — nothing reads it back.
   */
  saveRecentGroups(items: GroupListItem[]): Observable<void> {
    return from(
      this.idb.db.put(
        this.storeName,
        { items, totalCount: items.length, cachedAt: new Date().toISOString() },
        RECENT_GROUPS_CACHE_KEY,
      ),
    ).pipe(map(() => void 0));
  }

  getRecentGroups(): Observable<GroupListItem[] | null> {
    return from(this.idb.db.get(this.storeName, RECENT_GROUPS_CACHE_KEY)).pipe(
      map((entry) => entry?.items ?? null),
    );
  }

  saveGroupOverview(groupId: string, overview: GroupOverview): Observable<void> {
    return from(this.idb.db.put(this.overviewStoreName, overview, groupId)).pipe(
      map(() => void 0),
    );
  }

  getGroupOverview(groupId: string): Observable<GroupOverview | null> {
    return from(this.idb.db.get(this.overviewStoreName, groupId)).pipe(map((v) => v ?? null));
  }
}
