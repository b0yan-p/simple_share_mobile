export class PageData<T> {
  totalCount: number;
  skip: number;
  take: number;
  data: T[];

  constructor() {
    this.totalCount = this.skip = this.take = 0;
    this.data = [];
  }
}
