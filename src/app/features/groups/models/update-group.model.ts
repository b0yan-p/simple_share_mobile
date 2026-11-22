import { GroupType } from './group-type.model';
import { BaseModel } from 'src/app/core/models/base-model';

export class UpdateGroup implements BaseModel {
  id!: string;
  name!: string;
  type?: GroupType;
  coverImageKey!: string;
  currency?: string;
  simplifyDebts?: boolean;
}
