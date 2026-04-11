import { effect, Injectable, signal } from '@angular/core';
import { Network } from '@capacitor/network';

@Injectable({
  providedIn: 'root',
})
export class NetworkService {
  readonly isOnline = signal<boolean>(navigator.onLine);

  async initialize(): Promise<void> {
    const status = await Network.getStatus();
    this.isOnline.set(status.connected);
    Network.addListener('networkStatusChange', (s) => this.isOnline.set(s.connected));
  }
}
