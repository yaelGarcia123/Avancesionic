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

  //injectamos los servicios 
  firebaseSvc = inject(Firebase);
  utilsSvc = inject(Utils);

  ngOnInit() {}

  async submit() {
    if (this.form.valid) {
      const loading = await this.utilsSvc.loading();
      await loading.present();


      this.firebaseSvc.signIn(this.form.value as user)
        .then(res => {
         this.utilsSvc.routerLink(`/main/home`);

          console.log("✅ Login exitoso:", res);
        })
        .catch(error => {
          console.log("❌ Error en login:", error);
          this.utilsSvc.presentToast({
            message:error.message,
            duration:2500,
            color:'primary',
            position:'middle',
            icon:'alert-circle-outline'

          })
        })
        .finally(() => {
          loading.dismiss();
        });
    }
  }
 
}
