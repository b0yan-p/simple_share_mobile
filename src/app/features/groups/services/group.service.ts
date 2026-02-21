import { Injectable } from '@angular/core';
import { first, Observable } from 'rxjs';
import { BaseService } from 'src/app/core/services/base.service';
import { GroupOverview } from '../models/group-overview.model';
import { Group, GroupListItem } from '../models/group.model';
import { UpdateGroup } from '../models/update-group.model';

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

  override mapToListItem(item: Group) {
    return {
      id: item.id,
      name: item.name,
      simplifyDebts: item.simplifyDebts,
      createdAt: new Date(),
      deletedAt: null,
    } as GroupListItem;
  }

  public groupOverview(id: string): Observable<GroupOverview> {
    return this.httpClient.get<GroupOverview>(`${this.baseApi}/${id}/overview`).pipe(first());
  }
}
