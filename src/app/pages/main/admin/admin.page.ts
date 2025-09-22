import { Component, Input, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController, LoadingController, ModalController } from '@ionic/angular';
import { Firebase } from 'src/app/services/firebase';
import { AdminEditPage } from '../admin-edit/admin-edit.page';
import { doc, getFirestore } from 'firebase/firestore';
import { Utils } from 'src/app/services/utils';
import { AdminAddHousePagePage } from '../admin-add-house.page/admin-add-house.page.page';
import { HouseResident } from 'src/app/models/HouseResident';

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
  async updatePivotTable() {
  const db = getFirestore();

  for (const user of this.allUsers) {
    for (const house of user.houses) {
      const pivotData: HouseResident = {
        userRef: doc(db, `users/${user.id}`),
        houseRef: doc(db, `houses/${house.id}`), // ahora guardamos la referencia a la casa
        role: "propietario", // o residente según tu lógica
        createdAt: new Date()
      };

      // 🔹 Guardar en colección pivote
      await this.firebaseService.setDocument(
        `homeowners/${user.id}_${house.id}`, // ID único combinando user+house
        pivotData
      );
    }


    // Guardar en la colección "homeowner" con ID = userId

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

      //Guardar cambios en Firebase
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
      await this.updatePivotTable();
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
// Buscar el usuario al que se asignó la casa
const user = this.allUsers.find(u => u.id === newHouse.userId);
if (user) {
  user.houses.push({
    id: this.firebaseService.firestone.createId(), // o el ID generado de Firebase
    number: newHouse.number,
    active: newHouse.active,
    createdAt: new Date()
  });
}

// Luego actualizamos la tabla pivote
await this.updatePivotTable();

      this.utils.presentToast({ message: 'Casa agregada correctamente', color: 'success' });
      await this.updatePivotTable();
      this.loadAllData();
    }
  });

  return await modal.present();
}

async deleteHouse(houseId: string, userId: string) {
  const alert = await this.alertController.create({
    header: 'Confirmar eliminación',
    message: '¿Seguro que deseas eliminar esta casa?',
    buttons: [
      {
        text: 'Cancelar',
        role: 'cancel'
      },
      {
        text: 'Eliminar',
        role: 'destructive',
        handler: async () => {
          try {
            // 🔹 Eliminar de Firestore
            await this.firebaseService.deleteDocument(`places/${houseId}`);

            // 🔹 Actualizar lista local
            const user = this.allUsers.find(u => u.id === userId);
            if (user) {
              user.houses = user.houses.filter((h: any) => h.id !== houseId);
            }

            // 🔹 Actualizar tabla pivote
            await this.updatePivotTable();
            await this.loadAllData();
            this.utils.presentToast({
              message: 'Casa eliminada correctamente',
              color: 'success'
            });
          } catch (error) {
            console.error('Error eliminando casa:', error);
            this.presentAlert('Error', 'No se pudo eliminar la casa');
          }
        }
      }
    ]
  });

  await alert.present();
}

  navigateToProfile() {
    this.router.navigate(['/profile']);
  }


}