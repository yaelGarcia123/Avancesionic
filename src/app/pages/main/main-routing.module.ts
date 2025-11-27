import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { MainPage } from './main.page';

const routes: Routes = [
  {
    path: '',
    component: MainPage,
  },
 {
  path: 'manager-tickets',
  loadChildren: () =>
    import('./manager-tickets/manager-tickets.module').then(
      (m) => m.ManagerTicketsPageModule
    ),
 },
 {
  path: 'home',
  loadChildren: () =>
    import('./home/home.module').then((m) => m.HomePageModule),
  },
 {  path: 'admin',
    loadChildren: () =>
      import('./admin/admin.module').then((m) => m.AdminPageModule),
 }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class MainPageRoutingModule {}
