import { BaseModel } from 'src/app/core/models/base-model';

export class UpdateGroup implements BaseModel {
  id!: string;
  name!: string;
  simplifyDebts?: boolean;
}
