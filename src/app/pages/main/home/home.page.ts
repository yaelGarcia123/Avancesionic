import { Component, inject, OnInit } from '@angular/core';
import { Place } from 'src/app/models/places';
import { Firebase } from 'src/app/services/firebase';
import { Utils } from 'src/app/services/utils';
import { getAuth, onAuthStateChanged } from 'firebase/auth';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: false,
})
export class HomePage implements OnInit {

  firebaseSvc = inject(Firebase);
  utilsSvc = inject(Utils);

  places: Place[] = [];
  loading = true;
  error: string = '';
  isModalOpen = false;

  constructor() { }

  ngOnInit() {
    const auth = getAuth();

    onAuthStateChanged(auth, (user) => {
      if (user) {
        this.loadPlaces();
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
        color: 'danger'
      });
    } finally {
      this.loading = false;
    }
  }

  handleRefresh(event: any) {
    this.loadPlaces().then(() => {
      event.target.complete();
    });
  }

  // Open modal
  openOptions() {
    this.isModalOpen = true;
  }

  // Close modal
  closeModal() {
    this.isModalOpen = false;
  }

  // Go to messages
  async goToMessages() {
  this.closeModal();

  await this.utilsSvc.routerLink('/messages');

  this.utilsSvc.presentToast({
    message: 'Opening Messages...',
    duration: 1500,
    color: 'primary'
  });
}

  // Go to notices
  goToNotices() {
    this.closeModal();
    this.utilsSvc.presentToast({
      message: 'Opening Notices...',
      duration: 1500,
      color: 'tertiary'
    });
    // Aquí puedes hacer router.navigate(['/notices']);
  }
}
