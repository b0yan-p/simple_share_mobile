import { BaseModel } from 'src/app/core/models/base-model';

export class GroupListItem {
  currency!: string;
  id!: string;
  name!: string;
  simplifyDebts!: boolean;
  createdAt!: Date;
  deletedAt?: Date | null;
  netBalance: number = 0;
  netBalanceMessage: string = 'Settled Up';
}

export class Group implements BaseModel {
  currency!: string;
  currencyLocked!: boolean;
  canChangeCurrency!: boolean;
  id!: string;
  name!: string;
  simplifyDebts?: boolean;
}
