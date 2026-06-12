import { Routes } from '@angular/router';
import { authGuard } from '@core/guards/auth-guard';

export const VIEWS_ROUTES: Routes = [
  {
    path: 'home',
    loadComponent: () =>
      import('../home/home.component').then((mod) => mod.HomeComponent),
    data: { title: 'Inicio' },
  },
  {
    path: 'docs',
    loadComponent: () =>
      import('./docs-list.component').then((mod) => mod.DocsListComponent),
    data: { title: 'Documentos' },
  },
  {
    path: 'docs/new',
    loadComponent: () =>
      import('./doc-editor.component').then((mod) => mod.DocEditorComponent),
    data: { title: 'Nuevo documento' },
  },
  {
    path: 'docs/:id',
    loadComponent: () =>
      import('./doc-editor.component').then((mod) => mod.DocEditorComponent),
    data: { title: 'Editar documento' },
  },
  {
    path: 'espacios',
    loadComponent: () =>
      import('../espacios/espacios.component').then((mod) => mod.EspaciosComponent),
    data: { title: 'Espacios' },
  },
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full',
  },
  {
    path: '**',
    redirectTo: 'home',
  },
];