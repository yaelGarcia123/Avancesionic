import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { AdminEditPageRoutingModule } from './admin-edit-routing.module';

import { AdminEditPage } from './admin-edit.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    AdminEditPageRoutingModule
  ],
  declarations: [AdminEditPage]
})
export class AdminEditPageModule {}
