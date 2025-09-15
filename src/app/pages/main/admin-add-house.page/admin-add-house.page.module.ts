import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { AdminAddHousePagePageRoutingModule } from './admin-add-house.page-routing.module';

import { AdminAddHousePagePage } from './admin-add-house.page.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    AdminAddHousePagePageRoutingModule
  ],
  declarations: [AdminAddHousePagePage]
})
export class AdminAddHousePagePageModule {}
