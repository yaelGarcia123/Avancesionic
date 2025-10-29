import { Component, Input, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { Place } from 'src/app/models/Places';

@Component({
  selector: 'app-admin-edit',
  templateUrl: './admin-edit.page.html',
  styleUrls: ['./admin-edit.page.scss'],
  standalone: false,
})
export class AdminEditPage implements OnInit {

    @Input() house!: Place; // the house received from the admin page

  constructor(private modalCtrl: ModalController) {}

  ngOnInit() {}

  // Close the modal, optionally returning data
  dismiss(data?: any) {
    this.modalCtrl.dismiss(data);
  }

  // Save changes and return the updated house
  saveChanges() {
    this.dismiss(this.house);
  }
}
