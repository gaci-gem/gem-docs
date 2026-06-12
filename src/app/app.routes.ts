import { Routes } from '@angular/router';
import { authGuard } from '@core/guards/auth-guard';
import { VerticalLayout } from '@layouts/vertical-layout/vertical-layout';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./views/login/login.component').then((mod) => mod.LoginComponent),
    canActivate: [],
  },
  {
    path: '',
    component: VerticalLayout,
    loadChildren: () =>
      import('./views/views.route').then((mod) => mod.VIEWS_ROUTES),
    canActivate: [authGuard],
  },
];