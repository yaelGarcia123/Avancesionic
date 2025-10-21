import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import {
  AlertController,
  LoadingController,
  ModalController,
  ToastController,
  ToastOptions,
} from '@ionic/angular';

@Injectable({
  providedIn: 'root',
})
export class Utils {
  loadingCtrl = inject(LoadingController);
  toastCtlr = inject(ToastController);
  alertCtrl = inject(AlertController);
  modalCtrl = inject(ModalController);
  router = inject(Router);

  // Crear loading y presentarlo automáticamente
  async showLoading() {
    const loading = await this.loadingCtrl.create({
      spinner: 'crescent',
    });
    await loading.present();
    return loading;
  }

  // Solo crear loading (sin presentarlo)
  loading() {
    return this.loadingCtrl.create({
      spinner: 'crescent',
    });
  }

  // Mostrar toast
  async presentToast(opts?: ToastOptions) {
    const toast = await this.toastCtlr.create(opts);
    toast.present();
  }

  // Redirigir a cualquier ruta
  routerLink(url: string) {
    return this.router.navigateByUrl(url);
  }

  // Guardar en localStorage
  saveLocalStorage(key: string, value: any) {
    return localStorage.setItem(key, JSON.stringify(value));
  }

  // Obtener desde localStorage
  getFromLocalStorage(key: string): any {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  }
}
