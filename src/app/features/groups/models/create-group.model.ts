import { GroupType } from './group-type.model';
export interface CreateGroup {
  name: string;
  type?: GroupType;
  currency: string;
  simplifyDebts?: boolean;
}
