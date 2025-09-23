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

  // Login method
  async submit() {
    if (!this.form.valid) return;

    const loading = await this.utilsSvc.showLoading();

    try {
       // Try to sign in with Firebase Authentication
      const res = await this.firebaseSvc.signIn(this.form.value as user);
      await this.getUserInfo(res.user.uid);
    } catch (error: any) {
      console.log("❌ Login error:", error);
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

  // Get user information and redirect based on role
  async getUserInfo(uid: string) {
    const loading = await this.utilsSvc.showLoading();

    try {
      const userData = await this.firebaseSvc.getDocument(`users/${uid}`) as user;
      const completeUser = { ...userData, uid }; // Creates a new object that copies all properties from userData and adds/ensures the uid property

      this.utilsSvc.saveLocalStorage('users', completeUser);

      if (completeUser.admin) {
        this.utilsSvc.routerLink('/main/admin');
        this.utilsSvc.presentToast({
          message: `Welcome Administrator ${completeUser['name']}`,
          duration: 1500,
          color: 'success',
          position: 'middle',
          icon: 'shield-checkmark-outline',
        });
      } else {
        this.utilsSvc.routerLink('/main/home');
        this.utilsSvc.presentToast({
          message: `Welcome ${completeUser['name']}`,
          duration: 1500,
          color: 'primary',
          position: 'middle',
          icon: 'person-circle-outline',
        });
      }

      this.form.reset();
    } catch (error) {
      console.log('❌ Error getting user information:', error);
      this.utilsSvc.presentToast({
        message: 'Error loading user information',
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
