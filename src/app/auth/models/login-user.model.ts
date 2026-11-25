export interface LoginUser {
  id: string;
  firstName: string;
  lastName: string;
  displayName?: string;
  fullName: string;
  token: string;
  email: string;
}
