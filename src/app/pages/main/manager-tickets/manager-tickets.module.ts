import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { ManagerTicketsPageRoutingModule } from './manager-tickets-routing.module';

import { ManagerTicketsPage } from './manager-tickets.page';
import { SharedModule } from "src/app/shared/shared-module";

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ManagerTicketsPageRoutingModule,
    SharedModule
],
  declarations: [ManagerTicketsPage]
})
export class ManagerTicketsPageModule {}
