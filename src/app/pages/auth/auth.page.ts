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

  // injectamos los servicios 
  firebaseSvc = inject(Firebase);
  utilsSvc = inject(Utils);

  ngOnInit() {}

  async submit() {
    if (this.form.valid) {
      const loading = await this.utilsSvc.loading();
      await loading.present();

      this.firebaseSvc.signIn(this.form.value as user)
        .then(res => {
          this.getUserInfo(res.user.uid);
        })
        .catch(error => {
          console.log("❌ Error en login:", error);
          this.utilsSvc.presentToast({
            message: error.message,
            duration: 2500,
            color: 'primary',
            position: 'middle',
            icon: 'alert-circle-outline'
          })
        })
        .finally(() => {
          loading.dismiss();
        });
    }
  }

  // Método modificado para verificar si es admin
  async getUserInfo(uid: string) {
    if (this.form.valid) {
      const loading = await this.utilsSvc.loading();
      await loading.present();
      
      let path = `users/${uid}`;

      this.firebaseSvc
        .getDocument(path)
        .then((user: user) => {
          // Asegurémonos de incluir el UID en los datos del usuario
          const userData = {
            ...user,
            uid: uid // Agregamos el UID a los datos del usuario
          };
          
          this.utilsSvc.saveLocalStorage('users', userData);
          
          // Verificar si el usuario es administrador
          if (userData.admin === true) {
            // Redirigir a la pantalla de administrador
            this.utilsSvc.routerLink('/main/admin'); // Ajusta esta ruta según tu configuración
            this.utilsSvc.presentToast({
              message: `Bienvenido Administrador ${user['nombre']}`,
              duration: 1500,
              color: 'success',
              position: 'middle',
              icon: 'shield-checkmark-outline',
            });
          } else {
            // Redirigir a la pantalla normal de usuario
            this.utilsSvc.routerLink('/main/home');
            this.utilsSvc.presentToast({
              message: `Te damos la bienvenida ${user['nombre']}`,
              duration: 1500,
              color: 'primary',
              position: 'middle',
              icon: 'person-circle-outline',
            });
          }
          
          this.form.reset();
        })
        .catch((error) => {
          console.log('❌ Error al obtener información del usuario:', error);
          this.utilsSvc.presentToast({
            message: 'Error al cargar información del usuario',
            duration: 2500,
            color: 'danger',
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