import { inject, Injectable } from '@angular/core';
import { from, map, Observable } from 'rxjs';
import { SimpleShareIdbService } from 'src/app/core/services/simpleshare-idb.service';
import { GroupOverview } from '../models/group-overview.model';
import { GroupListItem } from '../models/group.model';

/** The group list is not scoped to anything, so the whole cache is one record. */
export const GROUPS_CACHE_KEY = 'all';

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

  saveGroupOverview(groupId: string, overview: GroupOverview): Observable<void> {
    return from(this.idb.db.put(this.overviewStoreName, overview, groupId)).pipe(
      map(() => void 0),
    );
  }

  getGroupOverview(groupId: string): Observable<GroupOverview | null> {
    return from(this.idb.db.get(this.overviewStoreName, groupId)).pipe(map((v) => v ?? null));
  }
}
