import { Component, inject, Input, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import {
  addDoc,
  serverTimestamp,
  query,
  where,
  getDocs,
  writeBatch,
} from '@angular/fire/firestore';

import { FirebaseServ } from 'src/app/services/firebase';
import { AdminEditPage } from '../admin-edit/admin-edit.page';
import { AdminAddHousePagePage } from '../admin-add-house.page/admin-add-house.page.page';
import { HouseResident } from 'src/app/models/HouseResident';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import {
  getFirestore,
  doc,
  collection,
  setDoc,
  deleteDoc,
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ChatService } from 'src/app/services/chatservice';
import { Utils } from 'src/app/services/utils';
import { UserServ } from 'src/app/services/user';
import { AuthServ } from 'src/app/services/auth';

@Component({
  selector: 'app-admin',
  templateUrl: './admin.page.html',
  styleUrls: ['./admin.page.scss'],
  standalone: false,
  
})


export class AdminPage implements OnInit {
  @Input() backbutton!: string;
// ===== TICKETS =====
ticketStatus: 'abierto' | 'cerrado' = 'abierto';

ticketView: 'houses' | 'tickets' | 'newTicket' = 'houses';

housesForTickets: any[] = [];
selectedHouseForTickets: any = null;

tickets: any[] = [];
loadingTickets: boolean = false;

newTicket = {
  area: '',
  descripcion: ''
};

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
  messageUsers: any[] = [];
  users$: Observable<any[]> | undefined;
  selectedChatUser: any = null;
  messages$: Observable<any[]> | undefined;
  newMessage: string = '';
  unreadCounts: { [userId: string]: number } = {};

  firebaseSvc = inject(FirebaseServ);
  authServ = inject(AuthServ);
  utils = inject(Utils);
  chatService = inject(ChatService);

  constructor(private router: Router) {}

  async ngOnInit() {
    const user = await this.authServ.getUser();
    this.currentUid = user?.uid || null;

    this.loadAllData();
    this.loadMessageUsers();
  }

  // ===========================
  //  USUARIOS Y CASAS
  // ===========================
  async loadAllData() {
    this.loading = true;
    const loading = await this.utils.alertCtrl.create({
      message: 'Cargando datos...',
    });
    await loading.present();

    try {
      const usersDocs = await this.firebaseSvc.getAllUsers();
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

        const userHouses = await this.firebaseSvc.getHousesByUserId(userDoc.id);
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
      .filter((user) => {
        const userMatch =
          user.name.toLowerCase().includes(term) ||
          user.email.toLowerCase().includes(term);
        const houseMatch = user.houses.some((house: any) =>
          house.number.toLowerCase().includes(term)
        );
        return userMatch || houseMatch;
      })
      .map((user) => ({
        ...user,
        showHouses: user.houses.some((house: any) =>
          house.number.toLowerCase().includes(term)
        ),
      }));
  }

  toggleUserHouses(userId: string) {
    this.filteredUsers = this.filteredUsers.map((user) => ({
      ...user,
      showHouses: user.id === userId ? !user.showHouses : user.showHouses,
    }));
  }

  async presentAlert(header: string, message: string) {
    const alert = await this.utils.alertCtrl.create({
      header,
      message,
      buttons: ['OK'],
    });
    await alert.present();
  }

  private async createOrUpdateHousePivot(userId: string, houseId: string) {
    const pivotRef = doc(getFirestore(), 'homeowners', houseId);
    const pivotData: HouseResident = {
      userRef: doc(getFirestore(), 'users', userId),
      houseRef: doc(getFirestore(), 'places', houseId),
      role: 'propietario',
      createdAt: new Date(),
    };
    await setDoc(pivotRef, pivotData);
  }

  private async deleteHousePivot(houseId: string) {
    const pivotRef = doc(getFirestore(), 'homeowners', houseId);
    await deleteDoc(pivotRef);
  }

  async openEditHouse(house: any, userId: string) {
    const modal = await this.utils.modalCtrl.create({
      component: AdminEditPage,
      componentProps: { house: { ...house } },
    });

    modal.onDidDismiss().then(async (result) => {
      if (result.data) {
        const updatedHouse = result.data;
        await this.firebaseSvc.updateDocument(`places/${updatedHouse.id}`, {
          number: updatedHouse.number,
          active: updatedHouse.active,
        });
        const user = this.allUsers.find((u) => u.id === userId);
        if (user) {
          const idx = user.houses.findIndex(
            (h: any) => h.id === updatedHouse.id
          );
          if (idx > -1) user.houses[idx] = updatedHouse;
        }
        await this.createOrUpdateHousePivot(userId, updatedHouse.id);
      }
    });

    await modal.present();
  }

  async addHouse() {
    const modal = await this.utils.modalCtrl.create({
      component: AdminAddHousePagePage,
      componentProps: { allUsers: this.allUsers },
    });

    modal.onDidDismiss().then(async (result) => {
      if (result.data) {
        const newHouse = result.data;
        const newHouseRef = doc(collection(getFirestore(), 'places'));
        const houseId = newHouseRef.id;

        const housePayload = {
          number: newHouse.number,
          active: newHouse.active,
          createdAt: new Date(),
          user: {
            ref: doc(getFirestore(), 'users', newHouse.userId),
            name:
              this.allUsers.find((u) => u.id === newHouse.userId)?.name || null,
          },
        };

        await setDoc(newHouseRef, housePayload);
        await this.createOrUpdateHousePivot(newHouse.userId, houseId);
        this.utils.presentToast({
          message: 'Casa agregada correctamente',
          color: 'success',
        });
        await this.loadAllData();
      }
    });

    await modal.present();
  }

  async deleteHouse(houseId: string, userId: string) {
    const alert = await this.utils.alertCtrl.create({
      header: 'Confirmar eliminación',
      message: '¿Seguro que deseas eliminar esta casa?',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: async () => {
            try {
              await this.firebaseSvc.deleteDocument(`places/${houseId}`);
              await this.deleteHousePivot(houseId);
              await this.loadAllData();
              this.utils.presentToast({
                message: 'Casa eliminada correctamente',
                color: 'success',
              });
            } catch (error) {
              this.presentAlert('Error', 'No se pudo eliminar la casa');
            }
          },
        },
      ],
    });
    await alert.present();
  }

  // ===========================
  // CHAT
  // ===========================
  async loadMessageUsers() {
    if (!this.currentUid) {
      console.error('No hay usuario admin autenticado');
      return;
    }

    try {
      this.messageUsers = await this.chatService.getUsersWithMessages(
        this.currentUid
      );
      this.messageUsers.forEach((user) => {
        this.unreadCounts[user.id] = user.unread ? 1 : 0;
      });
    } catch (error) {
      console.error('Error cargando usuarios con mensajes:', error);
      this.utils.presentToast({
        message: 'Error al cargar mensajes',
        duration: 3000,
        color: 'danger',
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
      this.messages$ = this.firebaseSvc
        .getCollectionData('messages', (ref) =>
          ref
            .where('participants', 'array-contains', this.currentUid)
            .orderBy('timestamp', 'asc')
        )
        .pipe(
          map((messages: any[]) =>
            messages
              .filter(
                (m) =>
                  (m.fromUid === this.currentUid && m.toUid === user.id) ||
                  (m.fromUid === user.id && m.toUid === this.currentUid)
              )
              .sort((a, b) => {
                const ta =
                  a?.timestamp?.toMillis?.() ??
                  (a?.timestamp?._seconds ? a.timestamp._seconds * 1000 : null);
                const tb =
                  b?.timestamp?.toMillis?.() ??
                  (b?.timestamp?._seconds ? b.timestamp._seconds * 1000 : null);
                const va = ta ?? a?.clientAt ?? 0;
                const vb = tb ?? b?.clientAt ?? 0;
                if (va !== vb) return va - vb;
                const ida = a.id ?? '';
                const idb = b.id ?? '';
                return ida < idb ? -1 : ida > idb ? 1 : 0;
              })
          )
        );

      await this.markMessagesAsRead(user.id);
    } catch (error) {
      console.error('Error abriendo chat:', error);
      this.utils.presentToast({
        message: 'Error al cargar la conversación',
        duration: 3000,
        color: 'danger',
      });
    }
  }

  async markMessagesAsRead(userId: string) {
    if (!this.currentUid) return;

    try {
      const db = getFirestore(); //Obtienes la instancia del Firestore ya inicializado (la que registraste en tu AppModule o main.ts).
      const q = query(
        collection(db, 'messages'),
        where('fromUid', '==', userId), //mensajes que te envió ese usuario.
        where('toUid', '==', this.currentUid), //mensajes dirigidos a ti (el admin).
        where('read', '==', false) //solo los que aún no están leídos.
      );

      const snap = await getDocs(q);
      if (!snap.empty) {
        const batch = writeBatch(db);
        snap.forEach((d) => {
          batch.update(doc(db, 'messages', d.id), { read: true });
        });
        await batch.commit();
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
        color: 'warning',
      });
      return;
    }
    if (!this.selectedChatUser || !this.currentUid) {
      this.utils.presentToast({
        message: 'No hay conversación seleccionada',
        duration: 3000,
        color: 'danger',
      });
      return;
    }

    try {
      const currentUser = await this.authServ.getUser();

      // (opcional) threadKey para optimizar consultas futuras
      const a = this.currentUid;
      const b = this.selectedChatUser.id;
      const threadKey = a < b ? `${a}_${b}` : `${b}_${a}`;

      const messageData = {
        fromUid: this.currentUid,
        toUid: this.selectedChatUser.id,
        fromName: 'Administrador',
        toName: this.selectedChatUser.name || 'Usuario',
        fromEmail: currentUser?.email || '',
        toEmail: this.selectedChatUser.email || '',
        message: this.newMessage.trim(),
        timestamp: serverTimestamp(),
        clientAt: Date.now(), // 👈 respaldo local
        // 👈 orden consistente
        participants: [this.currentUid, this.selectedChatUser.id],
        read: false,
        type: 'admin_to_user',
        threadKey, // 👈 opcional pero útil
      };

      const db = getFirestore();
      await addDoc(collection(db, 'messages'), messageData); // 👈 no toca .firestore

      this.newMessage = '';
      this.utils.presentToast({
        message: 'Mensaje enviado',
        duration: 2000,
        color: 'success',
      });
      await this.loadMessageUsers();
    } catch (error: any) {
      console.error('Error enviando mensaje:', error);
      this.utils.presentToast({
        message: `Error al enviar mensaje: ${error.message}`,
        duration: 3000,
        color: 'danger',
      });
    }
  }

  setSection(section: string) {
  this.selectedSection = section;

  if (section === 'messages') {
    this.loadMessageUsers();
  }

  if (section === 'tickets') {
    this.ticketView = 'houses';
    this.loadTicketHouses();
  }
}


  closeChat() {
    this.selectedChatUser = null;
    this.messages$ = undefined;
  }

  navigateToProfile() {
    this.router.navigate(['/profile']);
  }

  loadTicketHouses() {
  this.housesForTickets = [];

  this.allUsers.forEach(user => {
    user.houses.forEach(house => {
      this.housesForTickets.push({
        id: house.id,
        number: house.number,
        active: house.active,
        owner: user.name
      });
    });
  });
}
openHouseTickets(house: any) {
  this.selectedHouseForTickets = house;
  this.ticketView = 'tickets';
  this.loadTicketsByHouse(house.id);
}
async loadTicketsByHouse(houseId: string) {
  this.loadingTickets = true;

  try {
    const db = getFirestore();

    const q = query(
      collection(db, 'tickets'),
      where('houseId', '==', houseId),
      where('status', '==', this.ticketStatus)
    );

    const snap = await getDocs(q);

    this.tickets = snap.docs.map(d => ({
      id: d.id,
      ...d.data()
    }));
  } catch (e) {
    console.error('Error cargando tickets:', e);
  }

  this.loadingTickets = false;
}

openNewTicket() {
  this.newTicket = {
    area: '',
    descripcion: ''
  };
  this.ticketView = 'newTicket';
}
async saveTicket() {
  if (!this.selectedHouseForTickets) return;

  try {
    const db = getFirestore();

    await addDoc(collection(db, 'tickets'), {
      houseId: this.selectedHouseForTickets.id,
      area: this.newTicket.area,
      descripcion: this.newTicket.descripcion,
      status: 'abierto',
      createdAt: serverTimestamp(),
      createdBy: this.currentUid
    });

    this.utils.presentToast({
      message: 'Ticket creado correctamente',
      color: 'success',
      duration: 2000
    });

    this.ticketView = 'tickets';
    this.loadTicketsByHouse(this.selectedHouseForTickets.id);

  } catch (e) {
    console.error(e);
    this.utils.presentToast({
      message: 'Error al crear ticket',
      color: 'danger'
    });
  }
}
changeTicketStatus(status: 'abierto' | 'cerrado') {
  this.ticketStatus = status;
  this.loadTicketsByHouse(this.selectedHouseForTickets.id);
}

}
