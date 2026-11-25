import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable, switchMap, throwError } from 'rxjs';
import { TokenStorageService } from 'src/app/auth/services/token-storage.service';
import { environment } from 'src/environments/environment';

export interface Profile {
  firstName: string;
  lastName: string;
  displayName: string;
}

@Injectable({ providedIn: 'root' })
export class ProfileService {
  private readonly http = inject(HttpClient);
  private readonly storage = inject(TokenStorageService);
  private readonly url = `${environment.baseAPIUrl}/profile/me`;

  load(): Observable<Profile> {
    return this.refreshCache(this.http.get<Profile>(this.url));
  }

  save(profile: Profile): Observable<Profile> {
    return this.refreshCache(this.http.put<Profile>(this.url, profile));
  }

  private refreshCache(request: Observable<Profile>): Observable<Profile> {
    const session = this.storage.user();
    return request.pipe(
      switchMap((profile) => {
        if (!session || session.token !== this.storage.user()?.token) {
          return throwError(() => new Error('Session changed'));
        }

        const { firstName, lastName, displayName } = profile;
        const fullName = [firstName, lastName].filter(Boolean).join(' ');

        return this.storage
          .setUser({ ...session, firstName, lastName, displayName, fullName })
          .pipe(map(() => profile));
      }),
    );
  }
}
