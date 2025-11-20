import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ManagerTicketsPage } from './manager-tickets.page';

const routes: Routes = [
  {
    path: '',
    component: ManagerTicketsPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ManagerTicketsPageRoutingModule {}
