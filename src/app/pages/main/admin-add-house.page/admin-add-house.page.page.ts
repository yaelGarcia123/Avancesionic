import { Component, Input, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';

@Component({
  selector: 'app-admin-add-house.page',
  templateUrl: './admin-add-house.page.page.html',
  styleUrls: ['./admin-add-house.page.page.scss'],
  standalone: false,
})
export class AdminAddHousePagePage implements OnInit {

  @Input() allUsers: any[] = []; // recibimos los usuarios desde AdminPage

  newHouse = { //definimos un objeto para la nueva casa
    number: '',
    userId: '',
    activado: true
  };


  ngOnInit() {
  }
  constructor(private modalCtrl: ModalController) {}

  dismiss() {
    this.modalCtrl.dismiss();
  }

  save() {//Valida que el número de casa y el usuario estén seleccionados.
    if (!this.newHouse.number || !this.newHouse.userId) { //
      return;
    }
    this.modalCtrl.dismiss(this.newHouse);
  }
}
