import { inject, Injectable } from '@angular/core';
import { from, map, Observable } from 'rxjs';
import { SimpleShareIdbService } from 'src/app/core/services/simpleshare-idb.service';
import { GroupMember } from '../models/group-member.model';

@Injectable({
  providedIn: 'root',
})
export class GroupMemberIdbService {
  private readonly idb = inject(SimpleShareIdbService);
  private readonly storeName = 'group_members';

  saveGroupMembers(groupId: string, members: GroupMember[]): Observable<void> {
    return from(this.idb.db.put(this.storeName, members, groupId)).pipe(map(() => void 0));
  }

  getGroupMembers(groupId: string): Observable<GroupMember[] | null> {
    return from(this.idb.db.get(this.storeName, groupId)).pipe(map((v) => v ?? null));
  }

  deleteGroupMembers(groupId: string): Observable<void> {
    return from(this.idb.db.delete(this.storeName, groupId));
  }
}
