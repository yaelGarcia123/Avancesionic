import { Component, Input, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController, LoadingController, ModalController } from '@ionic/angular';
import { Firebase } from 'src/app/services/firebase';
import { AdminEditPage } from '../admin-edit/admin-edit.page';
import { doc, getFirestore } from 'firebase/firestore';
import { Utils } from 'src/app/services/utils';
import { AdminAddHousePagePage } from '../admin-add-house.page/admin-add-house.page.page';

@Component({
  selector: 'app-admin',
  templateUrl: './admin.page.html',
  styleUrls: ['./admin.page.scss'],
  standalone: false,
})
export class AdminPage implements OnInit {
  @Input() backbutton!: string;
  
  allUsers: any[] = [];
  filteredUsers: any[] = [];
  searchTerm: string = '';
  loading: boolean = true;
  totalHouses: number = 0;
  activeHouses: number = 0;

  constructor(
      private modalCtrl: ModalController,

    private router: Router,
    private firebaseService: Firebase,
    private alertController: AlertController,
    private loadingController: LoadingController,
      private utils: Utils // <--- agregar aquí

  ) { }

  ngOnInit() {
    this.loadAllData();
  }

  async loadAllData() {
    this.loading = true;
    const loading = await this.loadingController.create({
      message: 'Cargando datos...',
    });
    await loading.present();

    try {
      // Obtener todos los usuarios
      const usersDocs = await this.firebaseService.getAllUsers();
      this.allUsers = [];
      this.totalHouses = 0;
      this.activeHouses = 0;

      for (const userDoc of usersDocs) {
        const userData: any = userDoc.data();//.data() → extrae los datos del documento en forma de objeto normal de JavaScript.
        const user = {//objeto user 
          id: userDoc.id,
          name: userData.name || 'Sin nombre',
          email: userData.email || 'Sin email',
          active: userData.active !== false,
          houses: [],
          showHouses: false // Nueva propiedad para controlar la visualización
        };

        // Obtener las casas de este usuario
        const userHouses = await this.firebaseService.getHousesByUserId(userDoc.id);
        user.houses = userHouses.map((house: any) => {
          this.totalHouses++;
          if (house.active) this.activeHouses++;
          return {
            id: house.id,
            number: house.number,
            active: house.active,
            createdAt: house.createdAt || new Date()
          };
        });

        this.allUsers.push(user);
      }

      this.filteredUsers = [...this.allUsers];
    } catch (error) {
      console.error('Error loading data:', error);
      this.presentAlert('Error', 'No se pudieron cargar los datos. Intenta nuevamente.');
    } finally {
      this.loading = false;
      await loading.dismiss();
    }
  }

  filterData() {
    if (this.searchTerm.length == 0) {
      this.filteredUsers = this.allUsers.map(user => ({
        ...user,
        
      }));
      return;
    }

    const term = this.searchTerm.toLowerCase();
    this.filteredUsers = this.allUsers.filter(user => {
      // Buscar en nombre o email del usuario
      const userMatch = user.name.toLowerCase().includes(term) || 
                        user.email.toLowerCase().includes(term);
      
      // Buscar en las casas del usuario
      const houseMatch = user.houses.some((house: any) => 
        house.number.toLowerCase().includes(term)
      );

      return userMatch || houseMatch;
    }).map(user => {
      // Si se encontró una coincidencia en las casas, mostrarlas automáticamente
      const houseMatch = user.houses.some((house: any) => 
        house.number.toLowerCase().includes(term)
      );
      
      return {
        ...user,
        showHouses: houseMatch // Mostrar casas solo si hay coincidencia en la búsqueda
      };
    });
  }

  toggleUserHouses(userId: string) {
    this.filteredUsers = this.filteredUsers.map(user => {
      if (user.id === userId) {
        return {
          ...user,
          showHouses: !user.showHouses
        };
      }
      return user;
    });
  }
  /*async exportData() {
    // Aquí implementarías la lógica para exportar datos
    const alert = await this.alertController.create({
      header: 'Exportar Datos',
      message: '¿Qué formato prefieres para exportar?',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'CSV',
          handler: () => {
            this.exportToCSV();
          }
        },
        {
          text: 'JSON',
          handler: () => {
            this.exportToJSON();
          }
        }
      ]
    });

    await alert.present();
  }*/

  /*exportToCSV() {
    // Lógica para exportar a CSV
    console.log('Exportando a CSV');
    this.presentAlert('Éxito', 'Datos exportados correctamente en formato CSV');
  }

  exportToJSON() {
    // Lógica para exportar a JSON
    console.log('Exportando a JSON');
    this.presentAlert('Éxito', 'Datos exportados correctamente en formato JSON');
  }
*/
  async presentAlert(header: string, message: string) {
    const alert = await this.alertController.create({
      header,
      message,
      buttons: ['OK']
    });

    await alert.present();
  }

async openEditHouse(house: any, userId: string) {
  const modal = await this.modalCtrl.create({
    component: AdminEditPage,
    componentProps: { house: { ...house } }, // copiamos para no mutar directo
  });

  modal.onDidDismiss().then(async (result) => {
    if (result.data) {
      const updatedHouse = result.data;

      // 🔹 Guardar cambios en Firebase
      await this.firebaseService.updateDocument(
        `places/${updatedHouse.id}`,
        {
          number: updatedHouse.number,
          active: updatedHouse.active,
        }
      );

      // 🔹 Actualizar la lista local
      const user = this.allUsers.find(u => u.id === userId);
      if (user) {
        const idx = user.houses.findIndex((h: any) => h.id === updatedHouse.id);
        if (idx > -1) {
          user.houses[idx] = updatedHouse;
        }
      }
    }
  });

  return await modal.present();
}

async addHouse() {
  const modal = await this.modalCtrl.create({
    component: AdminAddHousePagePage,
    componentProps: { allUsers: this.allUsers }
  });

  modal.onDidDismiss().then(async (result) => {
    if (result.data) {
      const newHouse = result.data;

      // Guardar en Firebase
      await this.firebaseService.setDocument(
        `places/${this.firebaseService.firestone.createId()}`, // 🔹 ojo: firestore, no firestone
        {
          number: newHouse.number,
          active: newHouse.active,
          createdAt: new Date(),
          user: {
            ref: doc(getFirestore(), 'users', newHouse.userId),
            name: this.allUsers.find(u => u.id === newHouse.userId)?.name
          }
        }
      );

      this.utils.presentToast({ message: 'Casa agregada correctamente', color: 'success' });
      this.loadAllData();
    }
  });

  return await modal.present();
}


  navigateToProfile() {
    this.router.navigate(['/profile']);
  }


}