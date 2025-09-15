import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { AdminAddHousePagePage } from './admin-add-house.page.page';

const routes: Routes = [
  {
    path: '',
    component: AdminAddHousePagePage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AdminAddHousePagePageRoutingModule {}
