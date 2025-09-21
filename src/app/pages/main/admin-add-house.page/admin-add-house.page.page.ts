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
  filteredUsers: any[] = []; // lista filtrada de usuarios
  searchTerm: string = '';

  newHouse = { // definimos un objeto para la nueva casa
    number: '',
    userId: '',
    active: true
  };

  constructor(private modalCtrl: ModalController) {}

  ngOnInit() {
    // inicializar con todos los usuarios
    this.filteredUsers = [...this.allUsers];
  }

  dismiss() {
    this.modalCtrl.dismiss();
  }

  save() {
    // Valida que el número de casa y el usuario estén seleccionados.
    if (!this.newHouse.number || !this.newHouse.userId) {
      return;
    }
    this.modalCtrl.dismiss(this.newHouse);
  }

  filterUsers() {
    const term = this.searchTerm.toLowerCase();
    this.filteredUsers = this.allUsers.filter(user =>
      user.name.toLowerCase().includes(term) ||
      user.email.toLowerCase().includes(term)
    );
  }
}
