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
        path: 'groups/:id',
        loadComponent: () =>
          import('./groups/pages/group-item/group-item.component').then(
            (m) => m.GroupItemComponent,
          ),
      },
      {
        path: 'groups/:id/details',
        loadComponent: () =>
          import('./groups/pages/group-detail-wrapper/group-detail-wrapper.component').then(
            (m) => m.GroupDetailWrapperComponent,
          ),
      },
      {
        path: 'groups/:id/expenses/new',
        loadComponent: () =>
          import('./expenses/pages/expense-item/expense-item.component').then(
            (c) => c.ExpenseItemComponent,
          ),
      },
      {
        path: 'groups/:id/expenses/pending/:pendingId',
        loadComponent: () =>
          import('./expenses/pages/expense-item/expense-item.component').then(
            (c) => c.ExpenseItemComponent,
          ),
      },
      {
        path: 'groups/:id/expenses/:expenseId',
        loadComponent: () =>
          import('./expenses/pages/expense-item/expense-item.component').then(
            (c) => c.ExpenseItemComponent,
          ),
      },
      {
        path: 'groups/:id/expenses/:expenseId/details',
        loadComponent: () =>
          import('./expenses/pages/expense-detail/expense-detail.component').then(
            (c) => c.ExpenseDetailComponent,
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
