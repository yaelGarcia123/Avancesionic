import { Component, Input, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { getFirestore, collection, getDocs } from '@angular/fire/firestore';

@Component({
  selector: 'app-admin-add-house.page',
  templateUrl: './admin-add-house.page.page.html',
  styleUrls: ['./admin-add-house.page.page.scss'],
  standalone: false,
})
export class AdminAddHousePagePage implements OnInit {
  @Input() allUsers: any[] = []; // receive users from AdminPage
  filteredUsers: any[] = []; // filtered list of users
  searchTerm: string = '';

  // 🔹 Lista de fraccionamientos que vienen de Firestore
  fraccionamientos: any[] = [];

  // 🔹 Objeto de la nueva casa
  newHouse = {
    number: '',
    fraccionamientoId: '',
    fraccionamientoNombre: '',
    userId: '',
    active: true,
  };

  constructor(private modalCtrl: ModalController) {}

  async ngOnInit() {
    // inicializamos usuarios filtrados
    this.filteredUsers = [...this.allUsers];

    // cargamos fraccionamientos desde Firestore
    await this.loadFraccionamientos();
  }

  // 🔹 Validación del formulario
  get formValid() {
    return (
      this.newHouse.number.trim() !== '' &&
      this.newHouse.userId.trim() !== '' &&
      this.newHouse.fraccionamientoId.trim() !== ''
    );
  }

  // 🔹 Cargar fraccionamientos desde Firestore
  async loadFraccionamientos() {
    const db = getFirestore();
    const snap = await getDocs(collection(db, 'subdivisions'));

    this.fraccionamientos = snap.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    }));
  }

  // 🔹 Cerrar modal sin datos
  dismiss() {
    this.modalCtrl.dismiss();
  }

  // 🔹 Guardar y regresar la casa al AdminPage
  save() {
    if (!this.formValid) {
      return;
    }

    const fracc = this.fraccionamientos.find(
      (f) => f.id === this.newHouse.fraccionamientoId
    );

    this.newHouse.fraccionamientoNombre = fracc?.nombre || '';

    this.modalCtrl.dismiss(this.newHouse);
  }

  // 🔹 Filtrar usuarios por nombre o email
  filterUsers() {
    const term = this.searchTerm.toLowerCase().trim();

    if (!term) {
      this.filteredUsers = [...this.allUsers];
      return;
    }

    this.filteredUsers = this.allUsers.filter(
      (user) =>
        user.name.toLowerCase().includes(term) ||
        user.email.toLowerCase().includes(term)
    );
  }
}
