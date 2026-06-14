import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'converter', pathMatch: 'full' },
  {
    path: 'converter',
    loadComponent: () => import('./pages/converter/converter.component').then(m => m.ConverterComponent)
  },
  {
    path: 'history',
    loadComponent: () => import('./pages/history/history.component').then(m => m.HistoryComponent)
  },
  {
    path: 'chart',
    loadComponent: () => import('./pages/chart/chart.component').then(m => m.ChartComponent)
  },
  {
    path: 'settings',
    loadComponent: () => import('./pages/settings/settings.component').then(m => m.SettingsComponent)
  },
  { path: '**', redirectTo: 'converter' }
];
