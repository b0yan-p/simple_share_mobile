import { BaseModel } from 'src/app/core/models/base-model';

export class GroupListItem {
  id!: string;
  name!: string;
  simplifyDebts!: boolean;
  createdAt!: Date;
  deletedAt?: Date | null;
}

export class Group implements BaseModel {
  id!: string;
  name!: string;
  simplifyDebts?: boolean;
}
