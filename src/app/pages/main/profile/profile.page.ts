import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Utils } from 'src/app/services/utils';
import { Firebase } from 'src/app/services/firebase';
import { AlertController } from '@ionic/angular';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
  standalone: false,
})
export class ProfilePage implements OnInit {
  userData: any = null; // Stores the current user data
  isEditing = false; // Flag to know if the user is in edit mode
  userForm: FormGroup;

  constructor(
    private utilsSvc: Utils,
    private fb: FormBuilder,
    private firebaseSvc: Firebase,
    private alertController: AlertController
  ) {
    // Initialize reactive form
    this.userForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      currentPassword: ['', Validators.required],
      password: [''], // new password (optional)
    });
  }

  ngOnInit() {
    this.loadUserData();
  }

  async loadUserData() {
    // Load user data from localStorage
    this.userData = await this.utilsSvc.getFromLocalStorage('users');
    if (this.userData) {
      // Populate form with existing data
      this.userForm.patchValue({
        name: this.userData.name,
        email: this.userData.email,
      });
    }
  }

  // Toggle edit mode
  toggleEdit() {
    this.isEditing = !this.isEditing;
  }

  // Cancel edit and reset form values
  cancelEdit() {
    this.isEditing = false;
    this.userForm.reset({
      name: this.userData?.name,
      email: this.userData?.email,
    });
  }

  async saveChanges() {
    if (!this.userForm.valid) return;

    const loading = await this.utilsSvc.showLoading();

    try {
      const user = await this.firebaseSvc.getUser();
      if (!user) throw new Error('User not authenticated');

      // 🔐 Reauthenticate before making sensitive changes
      await this.firebaseSvc.reauthenticateUser(
        this.userData.email,
        this.userForm.value.currentPassword
      );
      
      const updatedData: any = { name: this.userForm.value.name };

      // Update email if changed
      if (this.userForm.value.email !== this.userData.email) {
        await this.firebaseSvc.updateEmail(this.userForm.value.email);
        updatedData.email = this.userForm.value.email;
      }

      // Update password if provided
      if (this.userForm.value.password) {
        await this.firebaseSvc.updatePassword(this.userForm.value.password);
      }

      // Update user document in Firestore
      await this.firebaseSvc.updateDocument(
        `users/${this.userData.uid}`,
        updatedData
      );

      // ✅ Update localStorage and UI
      this.userData = { ...this.userData, ...updatedData };
      this.utilsSvc.saveLocalStorage('users', this.userData);

      this.isEditing = false;
      this.utilsSvc.presentToast({
        message: 'Profile updated successfully',
        duration: 2000,
        color: 'success',
      });
    } catch (error: any) {
      console.error('❌ Error updating profile:', error.message);
      this.utilsSvc.presentToast({
        message: error.message || 'Error updating profile',
        duration: 2000,
        color: 'danger',
      });
    } finally {
      loading.dismiss();
    }
  }

  // Confirm account deletion
  async confirmDelete() {
    const alert = await this.alertController.create({
      header: 'Confirm Deletion',
      message:
        'Are you sure you want to delete your account? This action cannot be undone.',
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        { text: 'Delete', handler: () => this.deleteAccount() },
      ],
    });

    await alert.present();
  }

  // Delete user account
  async deleteAccount() {
    const loading = await this.utilsSvc.showLoading();

    try {
      await this.firebaseSvc.deleteDocument(`users/${this.userData.uid}`);
      await this.firebaseSvc.deleteUser();

      this.utilsSvc.presentToast({
        message: 'Account deleted successfully',
        duration: 2000,
        color: 'success',
      });

      // 🔹 Optional: clear localStorage and redirect to login
      localStorage.clear();
      this.utilsSvc.routerLink('/auth');
    } catch (error: any) {
      console.error('❌ Error deleting account:', error);
      this.utilsSvc.presentToast({
        message: error.message || 'Error deleting account',
        duration: 2000,
        color: 'danger',
      });
    } finally {
      loading.dismiss();
    }
  }

  // Logout user
  async logout() {
    const loading = await this.utilsSvc.showLoading();

    try {
      await this.firebaseSvc.logout(); // 🔹 Method to log out from Firebase
      localStorage.clear(); // clear local data
      this.utilsSvc.routerLink('/auth'); // redirect to login
      this.utilsSvc.presentToast({
        message: 'Logged out successfully',
        duration: 2000,
        color: 'success',
      });
    } catch (error: any) {
      console.error('❌ Error logging out:', error);
      this.utilsSvc.presentToast({
        message: error.message || 'Error logging out',
        duration: 2000,
        color: 'danger',
      });
    } finally {
      loading.dismiss();
    }
  }
}
