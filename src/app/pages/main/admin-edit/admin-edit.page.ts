import { Component, Input, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { Place } from 'src/app/models/Places';
import { getFirestore, collection, getDocs } from '@angular/fire/firestore';

@Component({
  selector: 'app-admin-edit',
  templateUrl: './admin-edit.page.html',
  styleUrls: ['./admin-edit.page.scss'],
  standalone: false,
})
export class AdminEditPage implements OnInit {

  @Input() house!: Place;

  fraccionamientos: any[] = [];

  constructor(private modalCtrl: ModalController) {}

  async ngOnInit() {
    await this.loadFraccionamientos();
  }

  async loadFraccionamientos() {
    const db = getFirestore();
    const snap = await getDocs(collection(db, 'subdivisions'));

    this.fraccionamientos = snap.docs.map(d => ({
      id: d.id,
      ...d.data()
    }));
  }

  dismiss(data?: any) {
    this.modalCtrl.dismiss(data);
  }

  saveChanges() {

    const fracc = this.fraccionamientos.find(
      f => f.id === this.house.fraccionamientoId
    );

    this.house.fraccionamiento = fracc?.nombre || '';

    this.dismiss(this.house);
  }
}
