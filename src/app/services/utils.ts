import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import {
  LoadingController,
  ToastController,
  ToastOptions,
} from '@ionic/angular';

@Injectable({
  providedIn: 'root',
})
export class Utils {
  //“Dame la instancia de LoadingController y guárdala en loadingCtrl para usarla en esta clase.”
  loadingCtrl = inject(LoadingController);
  toastCtlr = inject(ToastController);
  router=inject(Router)

  loading() {
    // Retornamos la promesa del loading
    return this.loadingCtrl.create({
      spinner: 'crescent', // corregido
    });
  }
  //toast
  async presentToast(opts?: ToastOptions) {
    const toast = await this.toastCtlr.create(opts);
    toast.present();
  }
//enturta cualquier pagina disponible 
  routerLink(url: string){
    return this.router.navigateByUrl(url)
  }

  //guardar un elemento en el localstorage
  saveLocalStorage(key: string, value: any){
    return localStorage.setItem(key, JSON.stringify(value))
  }
//obtiene un elemento desde el localstorage
  getFromLocalStorage(key: string): any {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  }

}
