export interface TabItem {
  name: string;
  label: string;
  routerLink: string | string[];
  icon: string;
  activeIcon: string;
}

export const TabItems: TabItem[] = [
  {
    name: 'home',
    label: 'Home',
    routerLink: ['home'],
    icon: 'assets/icons/svg/home.svg',
    activeIcon: 'assets/icons/svg/home.svg',
  },
  {
    name: 'groups',
    label: 'Groups',
    routerLink: ['groups'],
    icon: 'assets/icons/svg/group.svg',
    activeIcon: 'assets/icons/svg/group.svg',
  },
  {
    name: 'activities',
    label: 'Activity',
    routerLink: ['activities'],
    icon: 'assets/icons/svg/activity.svg',
    activeIcon: 'assets/icons/svg/activity.svg',
  },
  {
    name: 'connections',
    label: 'Friends',
    routerLink: ['connections'],
    icon: 'assets/icons/svg/friends.svg',
    activeIcon: 'assets/icons/svg/friends.svg',
  },
  {
    name: 'settings',
    label: 'Settings',
    routerLink: ['settings'],
    icon: 'assets/icons/svg/settings.svg',
    activeIcon: 'assets/icons/svg/settings.svg',
  },
];
