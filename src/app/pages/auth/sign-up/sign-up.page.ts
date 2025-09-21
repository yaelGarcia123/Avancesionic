import { Component, inject, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { user } from 'src/app/models/user.model';
import { Firebase } from 'src/app/services/firebase';
import { Utils } from 'src/app/services/utils';

@Component({
  selector: 'app-sign-up',
  templateUrl: './sign-up.page.html',
  styleUrls: ['./sign-up.page.scss'],
  standalone: false,
})
export class SignUpPage implements OnInit {

  form = new FormGroup({
    uid: new FormControl(''),
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [Validators.required]),
    name: new FormControl('', [Validators.required, Validators.minLength(4)]),
  });

  firebaseSvc = inject(Firebase);
  utilsSvc = inject(Utils);

  ngOnInit() {}

  // Registrar usuario
  async submit() {
    if (!this.form.valid) return;

    const loading = await this.utilsSvc.showLoading();

    try {
      // Crear usuario en Firebase Auth
      const res = await this.firebaseSvc.signUp(this.form.value as user);

      // Guardar UID en el formulario
      this.form.controls.uid.setValue(res.user.uid);

      // Actualizar displayName en Firebase
      await this.firebaseSvc.updateUser(this.form.value.name);

      // Guardar en Firestore
      await this.setUserInfo(res.user.uid);

      console.log('✅ Registro exitoso:', res);
    } catch (error: any) {
      console.log('❌ Error en registro:', error);
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

  // Guardar datos del usuario en Firestore
  private async setUserInfo(uid: string) {
    const loading = await this.utilsSvc.showLoading();

    try {
      const path = `users/${uid}`;
      const { password, ...userData } = this.form.value; // ❌ Eliminamos la contraseña antes de guardar

      await this.firebaseSvc.setDocument(path, userData);

      // Guardar usuario en localStorage
      this.utilsSvc.saveLocalStorage('users', userData);

      // Redirigir al home
      this.utilsSvc.routerLink('/main/home');

      this.form.reset();

      console.log('✅ Datos guardados en Firestore');
    } catch (error: any) {
      console.log('❌ Error al guardar usuario:', error);
      this.utilsSvc.presentToast({
        message: error.message,
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
