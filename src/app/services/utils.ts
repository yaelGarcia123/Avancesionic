import { inject, Injectable } from '@angular/core';
import { LoadingController, ToastController,ToastOptions } from '@ionic/angular';

@Injectable({
  providedIn: 'root'
})
export class Utils {

  loadingCtrl = inject(LoadingController);

toastCtlr=inject(ToastController)

  loading() {
    // Retornamos la promesa del loading
    return this.loadingCtrl.create({
      spinner: 'crescent' // corregido
    });
  }
    //toast
    async presentToast(opts?: ToastOptions) {
  const toast = await this.toastCtlr.create(opts);
  toast.present();
}

    
  }
