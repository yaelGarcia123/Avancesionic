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
  constructor() { }

  ngOnInit() {
    this.loadPlaces();
  }

  loadPlaces() {
    this.firebaseSvc.getDocumentsByUserRef('places')
      .then((places) => {
        console.log('Lugares cargados:', places);
        this.places = places as Place[];
      })
      .catch((error) => {
        console.error('Error al cargar lugares:', error);
      });
  }

  
}
