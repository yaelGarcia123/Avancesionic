import { Component, Input, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { Place } from 'src/app/models/places';

@Component({
  selector: 'app-admin-edit',
  templateUrl: './admin-edit.page.html',
  styleUrls: ['./admin-edit.page.scss'],
  standalone: false,
})
export class AdminEditPage implements OnInit {

    @Input() house!: Place; // la casa que recibes desde el admin

  constructor(private modalCtrl: ModalController) {}
ngOnInit() {
  }
  dismiss(data?: any) {
    this.modalCtrl.dismiss(data);
  }

  saveChanges() {
    // Retorna la casa actualizada
    this.dismiss(this.house);

  

}
}