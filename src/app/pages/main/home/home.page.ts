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

  constructor() { }

  ngOnInit() {
    const auth = getAuth();

    // Listen for authentication state changes
    onAuthStateChanged(auth, (user) => {
      if (user) {
        // Load places if user is authenticated
        this.loadPlaces();
      } else {
        // No authenticated user
        this.loading = false;
        this.error = 'No authenticated user';
      }
    });
  }

  // Load places from Firestore for the current user
  async loadPlaces() {
    try {
      this.loading = true;
      this.error = '';
      
      const places = await this.firebaseSvc.getDocumentsByUserRef('places');
      console.log('Places loaded:', places);
      
      this.places = places as Place[];
    } catch (error: any) {
      console.error('Error loading places:', error);
      this.error = 'Error loading houses. Please try again.';
      
      // Show error toast
      this.utilsSvc.presentToast({
        message: this.error,
        duration: 3000,
        color: 'danger'
      });
    } finally {
      this.loading = false;
    }
  }

  // Pull-to-refresh handler
  handleRefresh(event: any) {
    this.loadPlaces().then(() => {
      event.target.complete();
    });
  }
}
