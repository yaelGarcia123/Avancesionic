import { Component, inject, OnInit } from '@angular/core';
import { Place } from 'src/app/models/places';
import { Firebase } from 'src/app/services/firebase';
import { Utils } from 'src/app/services/utils';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: false,
})
export class HomePage implements OnInit {
  
  firebaseSvc = inject(Firebase);
  utilsSvc = inject(Utils);

  places: Place[] = [];
  loading = true;
  error: string = '';

  constructor() { }

  ngOnInit() {
    this.loadPlaces();
  }

  async loadPlaces() {
    try {
      this.loading = true;
      this.error = '';
      
      const places = await this.firebaseSvc.getDocumentsByUserRef('places');
      console.log('Lugares cargados:', places);
      
      this.places = places as Place[];
    } catch (error: any) {
      console.error('Error al cargar lugares:', error);
      this.error = 'Error al cargar las casas. Intenta nuevamente.';
      
      // Mostrar toast de error
      this.utilsSvc.presentToast({
        message: this.error,
        duration: 3000,
        color: 'danger'
      });
    } finally {
      this.loading = false;
    }
  }

  // Método para recargar
  handleRefresh(event: any) {
    this.loadPlaces().then(() => {
      event.target.complete();
    });
  }
}