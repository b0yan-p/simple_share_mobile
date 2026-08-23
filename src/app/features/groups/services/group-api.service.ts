import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { first, Observable } from 'rxjs';
import { PageQueryParams } from 'src/app/core/models/base-query-params';
import { PageData } from 'src/app/core/models/page-data';
import { environment } from 'src/environments/environment';
import { CreateGroup } from '../models/create-group.model';
import { Group, GroupListItem } from '../models/group.model';
import { UpdateGroup } from '../models/update-group.model';

/**
 * Plain HTTP for the group list and its mutations. Deliberately separate from
 * GroupService: BaseService's create/update/delete toast their own errors and
 * patch an `items` signal through `mapToListItem()`, which returns `{}` and is
 * never overridden. GroupFacade owns the UX instead.
 */
@Injectable({
  providedIn: 'root',
})
export class GroupApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.baseAPIUrl}/group`;

  getGroups(page: PageQueryParams): Observable<PageData<GroupListItem>> {
    const params = new HttpParams().set('skip', page.skip).set('take', page.take);

    return this.http.get<PageData<GroupListItem>>(this.baseUrl, { params }).pipe(first());
  }

  createGroup(payload: CreateGroup): Observable<Group> {
    return this.http.post<Group>(this.baseUrl, payload).pipe(first());
  }

  updateGroup(payload: UpdateGroup): Observable<Group> {
    return this.http.put<Group>(this.baseUrl, payload).pipe(first());
  }

  deleteGroup(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`).pipe(first());
  }
}
