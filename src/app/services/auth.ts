import {
  createUserWithEmailAndPassword,
  EmailAuthProvider,
  getAuth,
  reauthenticateWithCredential,
  signInWithEmailAndPassword,
  updateProfile,
  User,
} from '@angular/fire/auth';
import { UserSystem } from '../models/UserSystem';
import { inject, Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { FirebaseServ } from './firebase';
import { Utils } from './utils';
import { UserServ } from './user';

@Injectable({
  providedIn: 'root',
})
export class AuthServ {
  auth = inject(AngularFireAuth);
  firebase = inject(FirebaseServ);

  userServ = inject(UserServ);
  public user: User = null as unknown as User;
  utilsSvc = inject(Utils);

  constructor() {
    console.log('Auth Service Initialized');
    // Initialization logic if needed
    getAuth().onAuthStateChanged((user) => {
      console.log('🚀 ~ AuthServ ~ constructor ~ user:', user);
      // debugger;
      if (user) {
        this.user = user;
        this.firebase.getUserByUid(this.user?.uid).then((userData) => {
          console.log('User data fetched:', userData);
          if (this.user && userData) {
            this.userServ.currentUser.next(userData);

            this.userServ.isAdmin();
                this.utilsSvc.saveLocalStorage('users', userData);

          }
        });
        console.log('User is signed in:', user);
      } else {
        this.user = null;
        this.userServ.currentUser.next(null);
        console.log('No user is signed in.');
      }
    });
  }

  // ==================== Authentication Status ====================
  // Returns true if a user is currently authenticated, false otherwise
  get authenticated(): boolean {
    console.log('Authenticated check:', this.user);
    return this.user !== null;
  }

  // ==================== Firebase Auth Instance ====================
  // Get the Firebase Auth instance
  getAuth() {
    return this.auth;
  }

  getUser() {
    return this.auth.currentUser;
  }

  // ==================== Sign In ====================
  // Sign in a user using email and password
  signIn(user: UserSystem) {
    return signInWithEmailAndPassword(getAuth(), user.email, user.password);
  }

  // Function to register
  signUp(user: UserSystem) {
    return createUserWithEmailAndPassword(getAuth(), user.email, user.password);
  }

  // Function to update profile
  updateUser(displayName: string) {
    return updateProfile(getAuth().currentUser, { displayName });
  }

  // Sign out the current user and clear local storage
  signOut() {
    getAuth()
      .signOut()
      .then(() => {
        console.log('User signed out successfully.');

        localStorage.removeItem('user');
        this.user = null;
        this.userServ.currentUser.next(null);
        this.utilsSvc.routerLink('/auth'); // Navigate to auth page
      })
      .catch((error) => {
        console.error('Error signing out:', error);
      });

    // this.utilsSvc.routerLink('/auth');  Navigate to auth page
  }

  async getCurrentUser(): Promise<UserSystem | null> {
    return this.userServ.currentUser.value;
  }

  // Re-authenticate the user
  async reauthenticateUser(email: string, password: string): Promise<void> {
    const user = getAuth().currentUser;
    if (!user) throw new Error('No authenticated user');

    const credential = EmailAuthProvider.credential(email, password);
    await reauthenticateWithCredential(user, credential);
  }
}
