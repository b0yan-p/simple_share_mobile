import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class UiService {
  itemLoading = signal<boolean>(false);
  listLoading = signal<boolean>(false);
}
