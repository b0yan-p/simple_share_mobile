import { Routes } from '@angular/router';
import { LayoutWrapperComponent } from '../shared/wrappers/layout-wrapper/layout-wrapper.component';

export const routes: Routes = [
  {
    path: '',
    component: LayoutWrapperComponent,
    children: [
      {
        path: 'home',
        loadComponent: () =>
          import('./home/pages/home/home.component').then((m) => m.HomeComponent),
      },
      {
        path: 'groups',
        loadComponent: () =>
          import('./groups/pages/group-list/group-list.component').then(
            (m) => m.GroupListComponent,
          ),
      },
      {
        path: 'groups/:id/details',
        loadComponent: () =>
          import('./groups/pages/group-details/group-details.component').then(
            (m) => m.GroupDetailsComponent,
          ),
      },
      {
        path: 'groups/:id',
        loadComponent: () =>
          import('./groups/pages/group-item/group-item.component').then(
            (m) => m.GroupItemComponent,
          ),
      },

      {
        path: 'activities',
        loadComponent: () =>
          import('./activities/pages/activity-list/activity-list.component').then(
            (m) => m.ActivityListComponent,
          ),
      },
      {
        path: 'connections',
        loadComponent: () =>
          import('./connections/pages/connection-list/connection-list.component').then(
            (m) => m.ConnectionListComponent,
          ),
      },
      {
        path: 'settings',
        loadComponent: () =>
          import('./settings/pages/settings/settings.component').then(
            (m) => m.SettingsComponent,
          ),
      },
    ],
  },
];
