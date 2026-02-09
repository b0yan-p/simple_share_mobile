import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';

import { Router } from '@angular/router';
import { catchError, first, Observable, switchMap } from 'rxjs';
import { environment } from 'src/environments/environment';
import { LoginInput } from '../models/login-input.model';
import { LoginUser } from '../models/login-user.model';
import { TokenStorageService } from './token-storage.service';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private http = inject(HttpClient);
  private tokenStorage = inject(TokenStorageService);
  private router = inject(Router);

  private loginAPI = `${environment.baseAPIUrl}/auth/login`;

  public login(input: LoginInput): Observable<boolean> {
    return this.http.post<LoginUser>(this.loginAPI, input).pipe(
      first(),
      switchMap((res) => this.tokenStorage.setUser(res)),
      switchMap((res) => this.tokenStorage.setAccessToken(res.token)),
      catchError((err) => {
        console.error(err);
        throw err;
      }),
    );
  }

  public logout() {
    this.tokenStorage.clearAll().subscribe(() => this.router.navigate(['']));
  }
}
