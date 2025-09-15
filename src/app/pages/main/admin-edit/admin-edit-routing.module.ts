import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { AdminEditPage } from './admin-edit.page';

const routes: Routes = [
  {
    path: '',
    component: AdminEditPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AdminEditPageRoutingModule {}
