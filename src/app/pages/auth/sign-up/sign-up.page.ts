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
    nombre: new FormControl('', [Validators.required, Validators.minLength(4)]),
  });

  firebaseSvc = inject(Firebase);
  utilsSvc = inject(Utils);

  ngOnInit() {}

  //verfica que el formulario se valide y muestre el loading osea la pantalla cargando
  async submit() {
    if (this.form.valid) {
      const loading = await this.utilsSvc.loading();
      await loading.present();
      //Llama a signUp(...) del servicio Firebase → crea el usuario en Firebase Authentication con correo y contraseña.
      this.firebaseSvc
        .signUp(this.form.value as user)
        .then(async (res) => {
          //updateUser(nombre) → actualiza el nombre del usuario en Firebase.
          await this.firebaseSvc.updateUser(this.form.value.nombre);
          //updateUser(nombre) → actualiza el nombre del usuario en Firebase.
          let uid = res.user.uid;
          //Obtiene el uid generado por Firebase y lo guarda en el formulario.
          this.form.controls.uid.setValue(uid);
          //Llama a setUserInfo(uid) → guarda los datos en Firestore.
          this.setUserInfo(uid);

          console.log('✅ Login exitoso:', res);
        })
        .catch((error) => {
          console.log('❌ Error en login:', error);
          this.utilsSvc.presentToast({
            message: error.message,
            duration: 2500,
            color: 'primary',
            position: 'middle',
            icon: 'alert-circle-outline',
          });
        })
        .finally(() => {
          loading.dismiss();
        });
    }
  }
  //uid es un parámetro que recibe la función y representa el ID del usuario en Firebase.
  async setUserInfo(uid: string) {
    if (this.form.valid) {
      const loading = await this.utilsSvc.loading();

      //loading.present() muestra el spinner en la pantalla mientras se realiza la operación.
      await loading.present();
      let path = `users/${uid}`;
      delete this.form.value.password;

      //Aquí guarda la información del usuario en Firestore

      //setDocument(path, this.form.value) → guarda en la colección users el objeto del formulario (nombre, email, uid).
      this.firebaseSvc
        .setDocument(path, this.form.value)
        //res es la respuesta que devuelve setDocument.
        .then(async (res) => {
          this.utilsSvc.saveLocalStorage(`users`, this.form.value);
          this.utilsSvc.routerLink(`/main/home`);
          this.form.reset();

          await this.firebaseSvc.updateUser(this.form.value.nombre);
          console.log('✅ Login exitoso:', res);
        })
        .catch((error) => {
          console.log('❌ Error en login:', error);
          this.utilsSvc.presentToast({
            message: error.message,
            duration: 2500,
            color: 'primary',
            position: 'middle',
            icon: 'alert-circle-outline',
          });
        })
        .finally(() => {
          loading.dismiss();
        });
    }
  }
}
