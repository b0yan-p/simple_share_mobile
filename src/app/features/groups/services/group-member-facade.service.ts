import { inject, Injectable } from '@angular/core';
import { catchError, Observable, of, switchMap, tap, throwError } from 'rxjs';
import { NetworkService } from 'src/app/core/services/network.service';
import { GroupMember } from '../models/group-member.model';
import { GroupMemberIdbService } from './group-member-idb.service';
import { GroupService } from './group.service';

@Injectable({
  providedIn: 'root',
})
export class GroupMemberFacade {
  private readonly groupService = inject(GroupService);
  private readonly groupMemberIdb = inject(GroupMemberIdbService);
  private readonly networkService = inject(NetworkService);

  getGroupMembers(groupId: string): Observable<GroupMember[]> {
    if (!this.networkService.isOnline()) return this.getCachedMembers(groupId);

    return this.groupService.getGroupMembers(groupId).pipe(
      tap((members) => this.groupMemberIdb.saveGroupMembers(groupId, members).subscribe()),
      catchError(() => this.getCachedMembers(groupId)),
    );
  }

  private getCachedMembers(groupId: string): Observable<GroupMember[]> {
    return this.groupMemberIdb
      .getGroupMembers(groupId)
      .pipe(
        switchMap((members) =>
          members ? of(members) : throwError(() => new Error('No cached member data')),
        ),
      );
  }
}
