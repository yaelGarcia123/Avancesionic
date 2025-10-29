import { Component, inject, OnInit } from '@angular/core';
import { Place } from 'src/app/models/Places';
import { FirebaseServ } from 'src/app/services/firebase';
import { Utils } from 'src/app/services/utils';
import { ChatService } from 'src/app/services/chatservice';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { ModalController } from '@ionic/angular';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: false,
})
export class HomePage implements OnInit {
  firebaseSvc = inject(FirebaseServ);
  utilsSvc = inject(Utils);
  chatSvc = inject(ChatService);

  places: Place[] = [];
  loading = true;
  error: string = '';
  isModalOpen = false;
  unreadCount: number = 0;

  constructor(private modalCtrl: ModalController) {}

  ngOnInit() {
    const auth = getAuth();

    onAuthStateChanged(auth, (user) => {
      if (user) {
        this.loadPlaces();
        this.loadUnreadCount();
      } else {
        this.loading = false;
        this.error = 'No authenticated user';
      }
    });
  }

  async loadPlaces() {
    try {
      this.loading = true;
      this.error = '';
      const places = await this.firebaseSvc.getDocumentsByUserRef('places');
      this.places = places as Place[];
    } catch (error: any) {
      this.error = 'Error loading houses. Please try again.';
      this.utilsSvc.presentToast({
        message: this.error,
        duration: 3000,
        color: 'danger',
      });
    } finally {
      this.loading = false;
    }
  }

  async loadUnreadCount() {
    try {
      this.unreadCount = await this.chatSvc.getUnreadCount();
    } catch (error) {
      console.error('Error loading unread count:', error);
    }
  }

  handleRefresh(event: any) {
    this.loadPlaces().then(() => {
      this.loadUnreadCount();
      event.target.complete();
    });
  }

  openOptions() {
    this.isModalOpen = true;
  }

  closeModal() {
    this.isModalOpen = false;
  }

  async goToMessages() {
    this.closeModal();
    await this.modalCtrl.dismiss(); // Cierra el modal y espera
    await this.utilsSvc.routerLink('/messages');
    this.loadUnreadCount();
  }

  goToNotices() {
    this.closeModal();
    this.utilsSvc.presentToast({
      message: 'Opening Notices...',
      duration: 1500,
      color: 'tertiary',
    });
  }
}
