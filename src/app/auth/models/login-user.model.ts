export interface LoginUser {
  id: string;
  firstName: string;
  lastName: string;
  displayName?: string;
  fullName: string;
  hasPassword?: boolean;
  token: string;
  email: string;
}
