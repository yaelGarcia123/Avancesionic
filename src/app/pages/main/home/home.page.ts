import { Component, OnInit } from '@angular/core';
import { Utils } from 'src/app/services/utils';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
    standalone: false,

})
export class HomePage implements OnInit {

  userData: any = null;

  constructor(private utilsSvc: Utils) {}

  ngOnInit() {
    this.loadUserData();
  }

  async loadUserData() {
    // Recuperar datos del usuario desde localStorage
    this.userData = await this.utilsSvc.getFromLocalStorage('users');
    
    // Si no hay datos en localStorage, intentar obtenerlos de otra manera
    if (!this.userData) {
      console.log('No se encontraron datos de usuario en localStorage');
    }
  }

  

}
