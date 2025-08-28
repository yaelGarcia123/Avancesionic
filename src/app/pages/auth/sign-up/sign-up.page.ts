import { Component,inject, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { user } from 'src/app/models/user.model';
import { Firebase } from 'src/app/services/firebase';
import { Utils } from 'src/app/services/utils';
@Component({
  selector: 'app-sign-up',
  templateUrl: './sign-up.page.html',
  styleUrls: ['./sign-up.page.scss'],
    standalone:false

})
export class SignUpPage implements OnInit {


  form = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [Validators.required]),
      nombre: new FormControl('', [Validators.required, Validators.minLength(4)]),

  });

  firebaseSvc = inject(Firebase);
  utilsSvc = inject(Utils);



  ngOnInit() {
  }
async submit() {
    if (this.form.valid) {
      const loading = await this.utilsSvc.loading();
      await loading.present();

      this.firebaseSvc.signUp(this.form.value as user).then(async res => {
         await this.firebaseSvc.updateUser(this.form.value.nombre)
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
