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

  /**
   * Returns a flat array, not PageData — the /recent endpoint has no paging.
   * The items stay raw: netBalanceMessage is derived on every read so the cache
   * can never hold a stale derived string.
   */
  getRecentGroups(take = 3): Observable<GroupListItem[]> {
    const params = new HttpParams().set('take', take);

    return this.http.get<GroupListItem[]>(`${this.baseUrl}/recent`, { params }).pipe(first());
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
