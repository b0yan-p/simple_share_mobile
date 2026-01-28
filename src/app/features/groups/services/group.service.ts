import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { first } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class GroupService {
  http = inject(HttpClient);
  readonly url = `${environment.baseAPIUrl}/Group?skip=0&take=10`;

  public groups() {
    return this.http.get<any>(this.url).pipe(first());
  }
}
