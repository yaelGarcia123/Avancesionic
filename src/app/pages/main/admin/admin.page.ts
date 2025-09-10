import { Component, Input, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController, LoadingController } from '@ionic/angular';
import { Firebase } from 'src/app/services/firebase';

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
    private router: Router,
    private firebaseService: Firebase,
    private alertController: AlertController,
    private loadingController: LoadingController
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
        const userData: any = userDoc.data();
        const user = {
          id: userDoc.id,
          name: userData.nombre || 'Sin nombre',
          email: userData.email || 'Sin email',
          active: userData.active !== false,
          houses: [],
          showHouses: false // Nueva propiedad para controlar la visualización
        };

        // Obtener las casas de este usuario
        const userHouses = await this.firebaseService.getHousesByUserId(userDoc.id);
        user.houses = userHouses.map((house: any) => {
          this.totalHouses++;
          if (house.activado) this.activeHouses++;
          return {
            id: house.id,
            number: house.number,
            activado: house.activado,
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
    if (!this.searchTerm) {
      this.filteredUsers = this.allUsers.map(user => ({
        ...user,
        showHouses: false // Ocultar casas cuando no hay búsqueda
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
  async exportData() {
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
  }

  exportToCSV() {
    // Lógica para exportar a CSV
    console.log('Exportando a CSV');
    this.presentAlert('Éxito', 'Datos exportados correctamente en formato CSV');
  }

  exportToJSON() {
    // Lógica para exportar a JSON
    console.log('Exportando a JSON');
    this.presentAlert('Éxito', 'Datos exportados correctamente en formato JSON');
  }

  async presentAlert(header: string, message: string) {
    const alert = await this.alertController.create({
      header,
      message,
      buttons: ['OK']
    });

    await alert.present();
  }




  navigateToProfile() {
    this.router.navigate(['/profile']);
  }


}