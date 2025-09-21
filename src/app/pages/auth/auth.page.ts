import { Component, inject, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { user } from 'src/app/models/user.model';
import { Firebase } from 'src/app/services/firebase';
import { Utils } from 'src/app/services/utils';

@Component({
  selector: 'app-auth',
  templateUrl: './auth.page.html',
  styleUrls: ['./auth.page.scss'],
  standalone: false,
})
export class AuthPage implements OnInit {

  form = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [Validators.required]),
  });

  firebaseSvc = inject(Firebase);
  utilsSvc = inject(Utils);

  ngOnInit() {}

  // Método de login
  async submit() {
    if (!this.form.valid) return;

    const loading = await this.utilsSvc.showLoading();

    try {
       // Intenta iniciar sesión con Firebase Authentication
      const res = await this.firebaseSvc.signIn(this.form.value as user);
      await this.getUserInfo(res.user.uid);
    } catch (error: any) {
      console.log("❌ Error en login:", error);
      this.utilsSvc.presentToast({
        message: error.message,
        duration: 2500,
        color: 'primary',
        position: 'middle',
        icon: 'alert-circle-outline',
      });
    } finally {
      loading.dismiss();
    }
  }

  // Obtener información del usuario y redirigir según rol
  async getUserInfo(uid: string) {
    const loading = await this.utilsSvc.showLoading();

    try {
      const userData = await this.firebaseSvc.getDocument(`users/${uid}`) as user;
      const completeUser = { ...userData, uid };//Crea un nuevo objeto que copia todas las propiedades de userData y añade/asegura la propiedad uid

      this.utilsSvc.saveLocalStorage('users', completeUser);

      if (completeUser.admin) {
        this.utilsSvc.routerLink('/main/admin');
        this.utilsSvc.presentToast({
          message: `Bienvenido Administrador ${completeUser['name']}`,
          duration: 1500,
          color: 'success',
          position: 'middle',
          icon: 'shield-checkmark-outline',
        });
      } else {
        this.utilsSvc.routerLink('/main/home');
        this.utilsSvc.presentToast({
          message: `Te damos la bienvenida ${completeUser['name']}`,
          duration: 1500,
          color: 'primary',
          position: 'middle',
          icon: 'person-circle-outline',
        });
      }

      this.form.reset();
    } catch (error) {
      console.log('❌ Error al obtener información del usuario:', error);
      this.utilsSvc.presentToast({
        message: 'Error al cargar información del usuario',
        duration: 2500,
        color: 'danger',
        position: 'middle',
        icon: 'alert-circle-outline',
      });
    } finally {
      loading.dismiss();
    }
  }
}
