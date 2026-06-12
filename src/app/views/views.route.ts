import { Routes } from '@angular/router';
import { authGuard } from '@core/guards/auth-guard';
import { HomeComponent } from './home/home.component';
import { DocsListComponent } from './docs/docs-list.component';
import { DocEditorComponent } from './docs/doc-editor.component';
import { EspaciosComponent } from './espacios/espacios.component';

export const VIEWS_ROUTES: Routes = [
  {
    path: 'home',
    component: HomeComponent,
    data: { title: 'Inicio' },
  },
  {
    path: 'docs',
    component: DocsListComponent,
    data: { title: 'Documentos' },
  },
  {
    path: 'docs/new',
    component: DocEditorComponent,
    data: { title: 'Nuevo documento' },
  },
  {
    path: 'docs/:id',
    component: DocEditorComponent,
    data: { title: 'Editar documento' },
  },
  {
    path: 'espacios',
    component: EspaciosComponent,
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