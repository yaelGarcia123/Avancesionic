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

  // Register user
  async submit() {
    if (!this.form.valid) return;

    const loading = await this.utilsSvc.showLoading();

    try {
      // Create user in Firebase Auth
      const res = await this.firebaseSvc.signUp(this.form.value as user);

      // Save UID in the form
      this.form.controls.uid.setValue(res.user.uid);

      // Update displayName in Firebase
      await this.firebaseSvc.updateUser(this.form.value.name);

      // Save user info in Firestore
      await this.setUserInfo(res.user.uid);

      console.log('✅ Registration successful:', res);
    } catch (error: any) {
      console.log('❌ Registration error:', error);
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

  // Save user data in Firestore
  private async setUserInfo(uid: string) {
    const loading = await this.utilsSvc.showLoading();

    try {
      const path = `users/${uid}`;
      const { password, ...userData } = this.form.value; // ❌ Remove password before saving

      await this.firebaseSvc.setDocument(path, userData);

      // Save user in localStorage
      this.utilsSvc.saveLocalStorage('users', userData);

      // Navigate to home
      this.utilsSvc.routerLink('/main/home');

      this.form.reset();

      console.log('✅ Data saved in Firestore');
    } catch (error: any) {
      console.log('❌ Error saving user:', error);
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
