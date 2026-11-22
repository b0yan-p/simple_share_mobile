export enum GroupType {
  Other = 0,
  Trip = 1,
  Roommates = 2,
  Couple = 3,
}

export const GROUP_TYPE_TITLES: Readonly<Record<GroupType, string>> = {
  [GroupType.Other]: 'Other',
  [GroupType.Trip]: 'Trip',
  [GroupType.Roommates]: 'Roommates',
  [GroupType.Couple]: 'Couple',
};
