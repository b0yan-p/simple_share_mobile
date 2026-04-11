import { Injectable, signal } from '@angular/core';
import { Network } from '@capacitor/network';
import { from, map, Observable, tap } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class NetworkService {
  readonly isOnline = signal<boolean>(navigator.onLine);

  initialize(): Observable<void> {
    return from(Network.getStatus()).pipe(
      tap((status) => {
        this.isOnline.set(status.connected);
        Network.addListener('networkStatusChange', (s) => this.isOnline.set(s.connected));
      }),
      map(() => void 0),
    );
  }
}
