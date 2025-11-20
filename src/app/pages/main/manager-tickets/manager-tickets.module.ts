import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { ManagerTicketsPageRoutingModule } from './manager-tickets-routing.module';

import { ManagerTicketsPage } from './manager-tickets.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ManagerTicketsPageRoutingModule
  ],
  declarations: [ManagerTicketsPage]
})
export class ManagerTicketsPageModule {}
