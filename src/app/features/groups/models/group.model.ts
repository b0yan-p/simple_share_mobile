import { GroupType } from './group-type.model';
import { BaseModel } from 'src/app/core/models/base-model';

export class GroupListItem {
  type?: GroupType;
  coverImageKey?: string | null;
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
  type?: GroupType;
  coverImageKey?: string | null;
  currency!: string;
  currencyLocked!: boolean;
  canChangeCurrency!: boolean;
  id!: string;
  name!: string;
  simplifyDebts?: boolean;
}
