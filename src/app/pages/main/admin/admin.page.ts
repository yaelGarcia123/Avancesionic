import { Component, Input, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController, LoadingController, ModalController } from '@ionic/angular';
import { Firebase } from 'src/app/services/firebase';
import { AdminEditPage } from '../admin-edit/admin-edit.page';
import { AdminAddHousePagePage } from '../admin-add-house.page/admin-add-house.page.page';
import { HouseResident } from 'src/app/models/HouseResident';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { getAuth } from 'firebase/auth';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ChatService } from 'src/app/services/chatservice';
import { doc, getFirestore, collection, setDoc, deleteDoc } from 'firebase/firestore';
import { Utils } from 'src/app/services/utils';

@Component({
  selector: 'app-admin',
  templateUrl: './admin.page.html',
  styleUrls: ['./admin.page.scss'],
  standalone: false,
})
export class AdminPage implements OnInit {
  @Input() backbutton!: string;

  // ===== Variables generales =====
  currentUid: string | null = null;
  selectedSection: string = 'users';

  // ===== Usuarios y Casas =====
  allUsers: any[] = [];
  filteredUsers: any[] = [];
  searchTerm: string = '';
  loading: boolean = true;
  totalHouses: number = 0;
  activeHouses: number = 0;

  // ===== Chat =====
  messageUsers: any[] = []; // lista de usuarios que han enviado mensajes
  users$: Observable<any[]> | undefined;
  selectedChatUser: any = null;
  messages$: Observable<any[]> | undefined;
  newMessage: string = '';
  unreadCounts: { [userId: string]: number } = {};

  private db = getFirestore();

  constructor(
    private modalCtrl: ModalController,
    private router: Router,
    private firebaseService: Firebase,
    private alertController: AlertController,
    private loadingController: LoadingController,
    private utils: Utils,
    private chatService: ChatService,
    private firestore: AngularFirestore // Inyectado en el constructor
  ) {}

  ngOnInit() {
    const auth = getAuth();
    this.currentUid = auth.currentUser?.uid || null;

    this.loadAllData(); // cargar usuarios y casas
    if (this.currentUid) this.loadMessageUsers(); // cargar usuarios con mensajes
  }

  // ===========================
  //  USUARIOS Y CASAS
  // ===========================
  async loadAllData() {
    this.loading = true;
    const loading = await this.loadingController.create({ message: 'Cargando datos...' });
    await loading.present();

    try {
      const usersDocs = await this.firebaseService.getAllUsers();
      this.allUsers = [];
      this.totalHouses = 0;
      this.activeHouses = 0;

      for (const userDoc of usersDocs) {
        const userData: any = userDoc.data();
        const user = {
          id: userDoc.id,
          name: userData.name || 'Sin nombre',
          email: userData.email || 'Sin email',
          active: userData.active !== false,
          houses: [],
          showHouses: false,
        };

        const userHouses = await this.firebaseService.getHousesByUserId(userDoc.id);
        user.houses = userHouses.map((house: any) => {
          this.totalHouses++;
          if (house.active) this.activeHouses++;
          return {
            id: house.id,
            number: house.number,
            active: house.active,
            createdAt: house.createdAt || new Date(),
          };
        });

        this.allUsers.push(user);
      }

      this.filteredUsers = [...this.allUsers];
    } catch (error) {
      console.error('Error loading data:', error);
      this.presentAlert('Error', 'No se pudieron cargar los datos.');
    } finally {
      this.loading = false;
      await loading.dismiss();
    }
  }

  filterData() {
    if (!this.searchTerm.trim()) {
      this.filteredUsers = [...this.allUsers];
      return;
    }

    const term = this.searchTerm.toLowerCase();
    this.filteredUsers = this.allUsers
      .filter(user => {
        const userMatch = user.name.toLowerCase().includes(term) || user.email.toLowerCase().includes(term);
        const houseMatch = user.houses.some((house: any) => house.number.toLowerCase().includes(term));
        return userMatch || houseMatch;
      })
      .map(user => ({
        ...user,
        showHouses: user.houses.some((house: any) => house.number.toLowerCase().includes(term)),
      }));
  }

  toggleUserHouses(userId: string) {
    this.filteredUsers = this.filteredUsers.map(user => ({
      ...user,
      showHouses: user.id === userId ? !user.showHouses : user.showHouses,
    }));
  }

  async presentAlert(header: string, message: string) {
    const alert = await this.alertController.create({ header, message, buttons: ['OK'] });
    await alert.present();
  }

  private async createOrUpdateHousePivot(userId: string, houseId: string) {
    const pivotRef = doc(this.db, 'homeowners', houseId);
    const pivotData: HouseResident = {
      userRef: doc(this.db, 'users', userId),
      houseRef: doc(this.db, 'places', houseId),
      role: 'propietario',
      createdAt: new Date(),
    };
    await setDoc(pivotRef, pivotData);
  }

  private async deleteHousePivot(houseId: string) {
    const pivotRef = doc(this.db, 'homeowners', houseId);
    await deleteDoc(pivotRef);
  }

  async openEditHouse(house: any, userId: string) {
    const modal = await this.modalCtrl.create({
      component: AdminEditPage,
      componentProps: { house: { ...house } },
    });

    modal.onDidDismiss().then(async result => {
      if (result.data) {
        const updatedHouse = result.data;
        await this.firebaseService.updateDocument(`places/${updatedHouse.id}`, {
          number: updatedHouse.number,
          active: updatedHouse.active,
        });
        const user = this.allUsers.find(u => u.id === userId);
        if (user) {
          const idx = user.houses.findIndex((h: any) => h.id === updatedHouse.id);
          if (idx > -1) user.houses[idx] = updatedHouse;
        }
        await this.createOrUpdateHousePivot(userId, updatedHouse.id);
      }
    });

    await modal.present();
  }

  async addHouse() {
    const modal = await this.modalCtrl.create({
      component: AdminAddHousePagePage,
      componentProps: { allUsers: this.allUsers },
    });

    modal.onDidDismiss().then(async result => {
      if (result.data) {
        const newHouse = result.data;
        const newHouseRef = doc(collection(this.db, 'places'));
        const houseId = newHouseRef.id;

        const housePayload = {
          number: newHouse.number,
          active: newHouse.active,
          createdAt: new Date(),
          user: {
            ref: doc(this.db, 'users', newHouse.userId),
            name: this.allUsers.find(u => u.id === newHouse.userId)?.name || null,
          },
        };

        await setDoc(newHouseRef, housePayload);
        await this.createOrUpdateHousePivot(newHouse.userId, houseId);
        this.utils.presentToast({ message: 'Casa agregada correctamente', color: 'success' });
        await this.loadAllData();
      }
    });

    await modal.present();
  }

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
              await this.loadAllData();
              this.utils.presentToast({ message: 'Casa eliminada correctamente', color: 'success' });
            } catch (error) {
              this.presentAlert('Error', 'No se pudo eliminar la casa');
            }
          },
        },
      ],
    });
    await alert.present();
  }

  //  MENSAJES chat
 
  async loadMessageUsers() {
    if (!this.currentUid) {
      console.error('No hay usuario admin autenticado');
      return;
    }
    
    try {
      console.log('Cargando usuarios con mensajes para admin:', this.currentUid);
      this.messageUsers = await this.chatService.getUsersWithMessages(this.currentUid);
      
      // Calcular mensajes no leídos para cada usuario
      this.messageUsers.forEach(user => {
        this.unreadCounts[user.id] = user.unread ? 1 : 0;
      });
      
      console.log('Usuarios con mensajes cargados:', this.messageUsers);
      
      if (this.messageUsers.length === 0) {
        console.log('No se encontraron usuarios con mensajes');
      }
    } catch (error) {
      console.error('Error cargando usuarios con mensajes:', error);
      this.utils.presentToast({
        message: 'Error al cargar mensajes',
        duration: 3000,
        color: 'danger'
      });
    }
  }

  async openChat(user: any) {
    console.log('Abriendo chat con usuario:', user);
    this.selectedChatUser = user;
    
    if (!this.currentUid) {
      console.error('No hay usuario admin autenticado');
      return;
    }

    try {
      // Cargar mensajes entre el admin y el usuario seleccionado
      this.messages$ = this.firestore
        .collection('messages', ref =>
          ref
            .where('participants', 'array-contains', this.currentUid)
            .orderBy('timestamp', 'asc')
        )
        .valueChanges({ idField: 'id' })
        .pipe(
          map((messages: any[]) => {
            const filteredMessages = messages.filter(msg => 
              (msg.fromUid === this.currentUid && msg.toUid === user.id) ||
              (msg.fromUid === user.id && msg.toUid === this.currentUid)
            );
            
            console.log('Mensajes filtrados:', filteredMessages);
            return filteredMessages;
          })
        );

      // Marcar mensajes como leídos
      await this.markMessagesAsRead(user.id);
    } catch (error) {
      console.error('Error abriendo chat:', error);
    }
  }

  async markMessagesAsRead(userId: string) {
    if (!this.currentUid) return;

    try {
      const messages = await this.chatService.getAdminMessages(this.currentUid);
      const unreadMessages = messages.filter(msg => 
        msg.fromUid === userId && 
        msg.toUid === this.currentUid && 
        !msg.read
      );

      for (const msg of unreadMessages) {
        // Usa AngularFirestore en lugar de updateDoc directo
        await this.firestore.doc(`messages/${msg.id}`).update({ 
          read: true 
        });
      }
    } catch (error) {
      console.error('Error marcando mensajes como leídos:', error);
    }
  }

  async sendMessage() {
    if (!this.newMessage.trim()) {
      this.utils.presentToast({
        message: 'Escribe un mensaje',
        duration: 2000,
        color: 'warning'
      });
      return;
    }

    if (!this.selectedChatUser || !this.currentUid) {
      this.utils.presentToast({
        message: 'No hay conversación seleccionada',
        duration: 3000,
        color: 'danger'
      });
      return;
    }

    try {
      const messageData = {
        fromUid: this.currentUid,
        toUid: this.selectedChatUser.id,
        fromName: 'Administrador',
        toName: this.selectedChatUser.name,
        fromEmail: '',
        toEmail: this.selectedChatUser.email,
        message: this.newMessage.trim(),
        timestamp: new Date(),
        participants: [this.currentUid, this.selectedChatUser.id],
        read: false,
        type: 'admin_to_user'
      };

      await this.firestore.collection('messages').add(messageData);
      
      console.log('Mensaje enviado:', messageData);
      this.newMessage = '';
      
      this.utils.presentToast({
        message: 'Mensaje enviado',
        duration: 2000,
        color: 'success'
      });

      // Recargar la lista de usuarios para actualizar el último mensaje
      await this.loadMessageUsers();
      
    } catch (error) {
      console.error('Error enviando mensaje:', error);
      this.utils.presentToast({
        message: 'Error al enviar mensaje',
        duration: 3000,
        color: 'danger'
      });
    }
  }

  setSection(section: string) {
    this.selectedSection = section;
    if (section === 'messages') {
      this.loadMessageUsers();
    }
  }

  closeChat() {
    this.selectedChatUser = null;
    this.messages$ = undefined;
  }

  navigateToProfile() {
    this.router.navigate(['/profile']);
  }
}