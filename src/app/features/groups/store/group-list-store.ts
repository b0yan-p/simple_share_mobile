import { Injectable } from '@angular/core';
import { CachedListStore } from 'src/app/core/store/cached-list-store';
import { GroupListItem } from '../models/group.model';

/**
 * The group list keeps no pagination or freshness state: every entry to the
 * screen reloads. `isFreshFor()` / `loadedAt` / `ttlMs` from the base are
 * therefore deliberately unused here — do not wire them up.
 */
@Injectable({
  providedIn: 'root',
})
export class GroupListStore extends CachedListStore<GroupListItem> {}
