import { Component, Input, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController, LoadingController, ModalController } from '@ionic/angular';
import { Firebase } from 'src/app/services/firebase';
import { AdminEditPage } from '../admin-edit/admin-edit.page';
import { doc, getFirestore, collection, setDoc, deleteDoc } from 'firebase/firestore';
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
  @Input() backbutton!: string; // Input to optionally show a back button label or route
  
  allUsers: any[] = [];        // Stores all loaded users with their houses
  filteredUsers: any[] = [];   // Stores the users after applying a search filter
  searchTerm: string = '';     // Holds the search term for filtering
  loading: boolean = true;     // Indicates whether data is currently loading
  totalHouses: number = 0;     // Total number of houses across all users
  activeHouses: number = 0;    // Total number of active houses

  private db = getFirestore(); // Firestore database reference

  constructor(
    private modalCtrl: ModalController,      // For opening modals (edit/add pages)
    private router: Router,                  // For page navigation
    private firebaseService: Firebase,       // Custom Firebase service for data fetching
    private alertController: AlertController,// To show alerts
    private loadingController: LoadingController, // To show loading indicators
    private utils: Utils                     // Utility service (e.g., toasts)
  ) {}

  ngOnInit() {
    this.loadAllData(); // Load all data when the component initializes
  }

  async loadAllData() {
    // Shows a loading spinner and fetches all users and their houses
    this.loading = true;
    const loading = await this.loadingController.create({
      message: 'Cargando datos...', // Message while loading
    });
    await loading.present();

    try {
      const usersDocs = await this.firebaseService.getAllUsers(); // Fetch users
      this.allUsers = [];
      this.totalHouses = 0;
      this.activeHouses = 0;

      // Iterate through each user document
      for (const userDoc of usersDocs) {
        const userData: any = userDoc.data();
        // Build a user object with default values
        const user = {
          id: userDoc.id,
          name: userData.name || 'Sin nombre',
          email: userData.email || 'Sin email',
          active: userData.active !== false,
          houses: [],
          showHouses: false
        };

        // Fetch houses for this user
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

        this.allUsers.push(user); // Add the user with their houses to the list
      }

      this.filteredUsers = [...this.allUsers]; // Initially, no filter applied
    } catch (error) {
      console.error('Error loading data:', error);
      this.presentAlert('Error', 'No se pudieron cargar los datos. Intenta nuevamente.');
    } finally {
      this.loading = false;
      await loading.dismiss(); // Hide the loading spinner
    }
  }

  // Creates or updates a pivot document linking a user and a house
  private async createOrUpdateHousePivot(userId: string, houseId: string) {
    const pivotRef = doc(this.db, 'homeowners', houseId);
    const pivotData: HouseResident = {
      userRef: doc(this.db, 'users', userId),   // Reference to the user document
      houseRef: doc(this.db, 'places', houseId),// Reference to the house document
      role: 'propietario',                      // Owner role
      createdAt: new Date()
    };
    await setDoc(pivotRef, pivotData);
  }

  // Deletes the pivot document for a house-owner relationship
  private async deleteHousePivot(houseId: string) {
    const pivotRef = doc(this.db, 'homeowners', houseId);
    await deleteDoc(pivotRef);
  }

  // Filters users and their houses by the search term
  filterData() {
    if (this.searchTerm.length == 0) {
      // If no search term, reset to all users
      this.filteredUsers = this.allUsers.map(user => ({ ...user }));
      return;
    }

    const term = this.searchTerm.toLowerCase();
    this.filteredUsers = this.allUsers.filter(user => {
      // Match by user name or email
      const userMatch = user.name.toLowerCase().includes(term) || 
                        user.email.toLowerCase().includes(term);
      // Match by any house number
      const houseMatch = user.houses.some((house: any) => 
        house.number.toLowerCase().includes(term)
      );
      return userMatch || houseMatch;
    }).map(user => {
      const houseMatch = user.houses.some((house: any) => 
        house.number.toLowerCase().includes(term)
      );
      // Show houses automatically if a house matches the filter
      return { ...user, showHouses: houseMatch };
    });
  }

  // Toggles the visibility of a user's houses
  toggleUserHouses(userId: string) {
    this.filteredUsers = this.filteredUsers.map(user => {
      if (user.id === userId) {
        return { ...user, showHouses: !user.showHouses };
      }
      return user;
    });
  }
  
  // Shows an alert with a header and message
  async presentAlert(header: string, message: string) {
    const alert = await this.alertController.create({
      header,
      message,
      buttons: ['OK']
    });
    await alert.present();
  }

  // Opens the edit house modal and updates Firestore when a house is changed
  async openEditHouse(house: any, userId: string) {
    const modal = await this.modalCtrl.create({
      component: AdminEditPage,
      componentProps: { house: { ...house } },
    });

    modal.onDidDismiss().then(async (result) => {
      if (result.data) {
        const updatedHouse = result.data;

        // Update the house document in Firestore
        await this.firebaseService.updateDocument(
          `places/${updatedHouse.id}`,
          { number: updatedHouse.number, active: updatedHouse.active }
        );

        // Update the local user object
        const user = this.allUsers.find(u => u.id === userId);
        if (user) {
          const idx = user.houses.findIndex((h: any) => h.id === updatedHouse.id);
          if (idx > -1) user.houses[idx] = updatedHouse;
        }

        // Update the pivot relationship
        await this.createOrUpdateHousePivot(userId, updatedHouse.id);
      }
    });

    return await modal.present();
  }

  // Opens the add house modal and creates a new house in Firestore
  async addHouse() {
    const modal = await this.modalCtrl.create({
      component: AdminAddHousePagePage,
      componentProps: { allUsers: this.allUsers }
    });

    modal.onDidDismiss().then(async (result) => {
      if (result.data) {
        const newHouse = result.data;

        // Create a new house document reference
        const newHouseRef = doc(collection(this.db, 'places'));
        const houseId = newHouseRef.id;

        const housePayload = {
          number: newHouse.number,
          active: newHouse.active,
          createdAt: new Date(),
          user: {
            ref: doc(this.db, 'users', newHouse.userId),
            name: this.allUsers.find(u => u.id === newHouse.userId)?.name || null
          }
        };

        // Save the new house to Firestore
        await setDoc(newHouseRef, housePayload);

        // Update the local user object
        const user = this.allUsers.find(u => u.id === newHouse.userId);
        if (user) {
          user.houses.push({
            id: houseId,
            number: newHouse.number,
            active: newHouse.active,
            createdAt: new Date()
          });
        }

        // Create the pivot relationship
        await this.createOrUpdateHousePivot(newHouse.userId, houseId);

        this.utils.presentToast({ message: 'Casa agregada correctamente', color: 'success' });
        await this.loadAllData(); // Reload data to refresh counts and lists
      }
    });

    return await modal.present();
  }

  // Deletes a house and its pivot, with confirmation alert
  async deleteHouse(houseId: string, userId: string) {
    const alert = await this.alertController.create({
      header: 'Confirmar eliminación',
      message: '¿Seguro que deseas eliminar esta casa?',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: async () => {
            try {
              await this.firebaseService.deleteDocument(`places/${houseId}`);
              await this.deleteHousePivot(houseId);

              const user = this.allUsers.find(u => u.id === userId);
              if (user) {
                user.houses = user.houses.filter((h: any) => h.id !== houseId);
              }

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

  // Navigates to the profile page
  navigateToProfile() {
    this.router.navigate(['/profile']);
  }
}
