export interface TabItem {
  name: string;
  routerLink: string | string[];
  icon: string;
  activeIcon: string;
}

export const TabItems: TabItem[] = [
  {
    name: 'home',
    routerLink: ['home'],
    icon: 'home-outline',
    activeIcon: 'home',
  },
  {
    name: 'groups',
    routerLink: ['groups'],
    icon: 'wallet-outline',
    activeIcon: 'wallet',
  },
  {
    name: 'activities',
    routerLink: ['activities'],
    icon: 'pulse-outline',
    activeIcon: 'pulse',
  },
  {
    name: 'connections',
    routerLink: ['connections'],
    icon: 'people-outline',
    activeIcon: 'people',
  },
  {
    name: 'settings',
    routerLink: ['settings'],
    icon: 'settings-outline',
    activeIcon: 'settings',
  },
];
