import { Injectable } from '@angular/core';
import { first, Observable } from 'rxjs';
import { BaseService } from 'src/app/core/services/base.service';
import { environment } from 'src/environments/environment';
import {
  AddGroupMembersRequest,
  AddGroupMembersResponse,
} from '../models/add-group-members.model';
import { BalanceResponse } from '../models/balance-response.model';
import { GroupMember } from '../models/group-member.model';
import { GroupOverview } from '../models/group-overview.model';
import { Group, GroupListItem } from '../models/group.model';
import {
  GroupInvitation,
  InvitePreview,
  JoinGroupResponse,
} from '../models/invite-preview.model';
import { UpdateGroup } from '../models/update-group.model';
import { mapGroupListItems } from '../utils/group-list.utils';

@Injectable({
  providedIn: 'root',
})
export class GroupService extends BaseService<GroupListItem, Group, UpdateGroup> {
  protected override get ctrlApi(): string {
    return 'group';
  }

  protected override get listApi(): string | null {
    return null;
  }

  protected override customListMap(items: GroupListItem[]): GroupListItem[] {
    return mapGroupListItems(items);
  }

  public groupOverview(id: string): Observable<GroupOverview> {
    return this.httpClient.get<GroupOverview>(`${this.baseApi}/${id}/overview`).pipe(first());
  }

  public getGroupMembers(groupId: string): Observable<GroupMember[]> {
    return this.httpClient
      .get<GroupMember[]>(`${environment.baseAPIUrl}/groupmember/${groupId}/members`)
      .pipe(first());
  }

  public addGroupMembers(
    groupId: string,
    payload: AddGroupMembersRequest,
  ): Observable<AddGroupMembersResponse> {
    return this.httpClient
      .post<AddGroupMembersResponse>(
        `${environment.baseAPIUrl}/groupmember/${groupId}/members/bulk`,
        payload,
      )
      .pipe(first());
  }

  public removeGroupMember(groupId: string, memberId: string): Observable<void> {
    return this.httpClient
      .delete<void>(`${environment.baseAPIUrl}/groupmember/${groupId}/members/${memberId}`)
      .pipe(first());
  }

  public getGroupInvitation(groupId: string): Observable<GroupInvitation> {
    return this.httpClient
      .get<GroupInvitation>(`${environment.baseAPIUrl}/groupinvitation/group/${groupId}`)
      .pipe(first());
  }

  /** Public endpoint — see SKIP_AUTH in auth-interceptor.interceptor.ts. */
  public getInvitePreview(token: string): Observable<InvitePreview> {
    return this.httpClient
      .get<InvitePreview>(`${environment.baseAPIUrl}/groupinvitation/${token}`)
      .pipe(first());
  }

  public joinGroup(token: string): Observable<JoinGroupResponse> {
    return this.httpClient
      .post<JoinGroupResponse>(`${environment.baseAPIUrl}/groupinvitation/${token}/join`, null)
      .pipe(first());
  }

  public getGroupBalances(groupId: string): Observable<BalanceResponse> {
    return this.httpClient
      .get<BalanceResponse>(`${this.baseApi}/${groupId}/balances`)
      .pipe(first());
  }
}
