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
  userData: any = null; // Guarda los datos actuales del usuario
  isEditing = false; // Bandera para saber si el usuario está en modo edición
  userForm: FormGroup;

  constructor(
    private utilsSvc: Utils,
    private fb: FormBuilder,
    private firebaseSvc: Firebase,
    private alertController: AlertController
  ) {
    this.userForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      currentPassword: ['', Validators.required],
      password: [''], // nueva contraseña (opcional)
    });
  }

  ngOnInit() {
    this.loadUserData();
  }

  async loadUserData() {
    this.userData = await this.utilsSvc.getFromLocalStorage('users');
    if (this.userData) {
      this.userForm.patchValue({
        name: this.userData.name,
        email: this.userData.email,
      });
    }
  }

  toggleEdit() {
    this.isEditing = !this.isEditing;
  }

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
      if (!user) throw new Error('Usuario no autenticado');

      // 🔐 Reautenticar antes de cambios sensibles
      await this.firebaseSvc.reauthenticateUser(
        this.userData.email,
        this.userForm.value.currentPassword
      );
      
      const updatedData: any = { name: this.userForm.value.name };

      if (this.userForm.value.email !== this.userData.email) {
        await this.firebaseSvc.updateEmail(this.userForm.value.email);
        updatedData.email = this.userForm.value.email;
      }

      if (this.userForm.value.password) {
        await this.firebaseSvc.updatePassword(this.userForm.value.password);
      }

      await this.firebaseSvc.updateDocument(
        `users/${this.userData.uid}`,
        updatedData
      );

      // ✅ Actualizamos localStorage y UI
      this.userData = { ...this.userData, ...updatedData };
      this.utilsSvc.saveLocalStorage('users', this.userData);

      this.isEditing = false;
      this.utilsSvc.presentToast({
        message: 'Perfil actualizado correctamente',
        duration: 2000,
        color: 'success',
      });
    } catch (error: any) {
      console.error('❌ Error al actualizar:', error.message);
      this.utilsSvc.presentToast({
        message: error.message || 'Error al actualizar el perfil',
        duration: 2000,
        color: 'danger',
      });
    } finally {
      loading.dismiss();
    }
  }

  async confirmDelete() {
    const alert = await this.alertController.create({
      header: 'Confirmar eliminación',
      message:
        '¿Estás seguro de que quieres eliminar tu cuenta? Esta acción no se puede deshacer.',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        { text: 'Eliminar', handler: () => this.deleteAccount() },
      ],
    });

    await alert.present();
  }

  async deleteAccount() {
    const loading = await this.utilsSvc.showLoading();

    try {
      await this.firebaseSvc.deleteDocument(`users/${this.userData.uid}`);
      await this.firebaseSvc.deleteUser();

      this.utilsSvc.presentToast({
        message: 'Cuenta eliminada correctamente',
        duration: 2000,
        color: 'success',
      });

      // 🔹 Opcional: limpiar localStorage y redirigir al login
      localStorage.clear();
      this.utilsSvc.routerLink('/auth');
    } catch (error: any) {
      console.error('❌ Error al eliminar cuenta:', error);
      this.utilsSvc.presentToast({
        message: error.message || 'Error al eliminar la cuenta',
        duration: 2000,
        color: 'danger',
      });
    } finally {
      loading.dismiss();
    }
  }

  async logout() {
  const loading = await this.utilsSvc.showLoading();

  try {
    await this.firebaseSvc.logout(); // 🔹 Método para cerrar sesión en Firebase
    localStorage.clear(); // limpiar datos locales
    this.utilsSvc.routerLink('/auth'); // redirigir al login
    this.utilsSvc.presentToast({
      message: 'Sesión cerrada correctamente',
      duration: 2000,
      color: 'success',
    });
  } catch (error: any) {
    console.error('❌ Error al cerrar sesión:', error);
    this.utilsSvc.presentToast({
      message: error.message || 'Error al cerrar sesión',
      duration: 2000,
      color: 'danger',
    });
  } finally {
    loading.dismiss();
  }
}

}
