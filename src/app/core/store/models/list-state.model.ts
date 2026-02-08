export class ListState<T> {
  status: LoadStatus;
  items: T[];
  error: string | null;

  constructor() {
    this.status = LoadStatus.Idle;
    this.items = [];
    this.error = null;
  }
}

export enum LoadStatus {
  Idle = 'idle',
  Loading = 'loading',
  Ready = 'ready',
  Error = 'error',
}
