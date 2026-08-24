import { Injectable } from '@angular/core';
import { CachedListStore } from 'src/app/core/store/cached-list-store';
import { GroupListItem } from '../models/group.model';

/**
 * Like the group list, the recent groups keep no freshness state: every entry to
 * the home screen reloads. `isFreshFor()` / `loadedAt` / `ttlMs` from the base are
 * therefore deliberately unused here — do not wire them up.
 */
@Injectable({ providedIn: 'root' })
export class RecentGroupsStore extends CachedListStore<GroupListItem> {}
