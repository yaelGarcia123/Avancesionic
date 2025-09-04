import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Utils } from 'src/app/services/utils';
import { Firebase } from 'src/app/services/firebase';
import { AlertController } from '@ionic/angular';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: false,
})
export class HomePage implements OnInit {
  userData: any = null;
  isEditing: boolean = false;
  userForm: FormGroup;

  constructor(
    private utilsSvc: Utils,
    private fb: FormBuilder,
    private firebaseSvc: Firebase,
    private alertController: AlertController
  ) {
    this.userForm = this.fb.group({
      nombre: ['', Validators.required],
      email: [{value: '', disabled: true}],
      password: ['']
    });
  }

  ngOnInit() {
    this.loadUserData();
  }

  async loadUserData() {
    this.userData = await this.utilsSvc.getFromLocalStorage('users');
    
    if (this.userData) {
      this.userForm.patchValue({
        nombre: this.userData.nombre,
        email: this.userData.email
      });
    }
  }

  toggleEdit() {
    this.isEditing = !this.isEditing;
  }

  cancelEdit() {
    this.isEditing = false;
    this.userForm.reset();
    this.userForm.patchValue({
      nombre: this.userData.nombre,
      email: this.userData.email
    });
  }

  async saveChanges() {
    if (this.userForm.valid) {
      const loading = await this.utilsSvc.loading();
      await loading.present();
      
      try {
        const updatedData = {
          nombre: this.userForm.value.nombre
        };
        
        // Actualizar en Firestore
        await this.firebaseSvc.updateDocument(`users/${this.userData.uid}`, updatedData);
        
        // Si hay nueva contraseña, actualizarla en Authentication
        if (this.userForm.value.password) {
          // Aquí iría la lógica para actualizar la contraseña
          // await this.firebaseSvc.updatePassword(this.userForm.value.password);
        }
        
        // Actualizar datos locales
        this.userData = { ...this.userData, ...updatedData };
        this.utilsSvc.saveLocalStorage('users', this.userData);
        
        this.isEditing = false;
        
        this.utilsSvc.presentToast({
          message: 'Perfil actualizado correctamente',
          duration: 2000,
          color: 'success'
        });
      } catch (error) {
        console.error('Error al actualizar:', error);
        this.utilsSvc.presentToast({
          message: 'Error al actualizar el perfil',
          duration: 2000,
          color: 'danger'
        });
      } finally {
        loading.dismiss();
      }
    }
  }

  async confirmDelete() {
    const alert = await this.alertController.create({
      header: 'Confirmar eliminación',
      message: '¿Estás seguro de que quieres eliminar tu cuenta? Esta acción no se puede deshacer.',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Eliminar',
          handler: () => {
            this.deleteAccount();
          }
        }
      ]
    });

    await alert.present();
  }

  async deleteAccount() {
    const loading = await this.utilsSvc.loading();
    await loading.present();
    
    try {
      // Eliminar de Firestore
      await this.firebaseSvc.deleteDocument(`users/${this.userData.uid}`);
      
      // Eliminar cuenta de Authentication
      // await this.firebaseSvc.deleteUser();
      
      // Cerrar sesión y redirigir
     
      this.utilsSvc.presentToast({
        message: 'Cuenta eliminada correctamente',
        duration: 2000,
        color: 'success'
      });
    } catch (error) {
      console.error('Error al eliminar cuenta:', error);
      this.utilsSvc.presentToast({
        message: 'Error al eliminar la cuenta',
        duration: 2000,
        color: 'danger'
      });
    } finally {
      loading.dismiss();
    }
  }
}