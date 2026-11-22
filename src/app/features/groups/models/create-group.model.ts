import { GroupType } from './group-type.model';
export interface CreateGroup {
  name: string;
  type?: GroupType;
  coverImageKey: string;
  currency: string;
  simplifyDebts?: boolean;
}
