import { inject, Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { provideFirestore } from '@angular/fire/firestore';
import { environment } from '../../environments/environment';
import {
  updateDoc,
  deleteDoc,
  getFirestore,
  setDoc,
  doc,
  addDoc,
  getDoc,
  collection,
  collectionData,
  query,
  getDocs,
  where,
  Firestore,
} from '@angular/fire/firestore';
import { deleteUser as firebaseDeleteUser } from 'firebase/auth';

import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  createUserWithEmailAndPassword,
  updateProfile,
  updateEmail as fbUpdateEmail,
  updatePassword as fbUpdatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  User,
} from 'firebase/auth';
import { user } from '../models/user.model';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class Firebase {
  private auth = inject(AngularFireAuth);
  firestone = inject(AngularFirestore);

  getAuth() {
    return getAuth();
  }

  getUser() {
    return this.auth.currentUser;
  }

  // Function to sign in
  signIn(user: user) {
    return signInWithEmailAndPassword(getAuth(), user.email, user.password);
  }

  // Function to register
  signUp(user: user) {
    return createUserWithEmailAndPassword(getAuth(), user.email, user.password);
  }

  // Function to update profile
  updateUser(displayName: string) {
    return updateProfile(getAuth().currentUser, { displayName });
  }

  // Re-authenticate the user
  async reauthenticateUser(email: string, password: string): Promise<void> {
    const user = getAuth().currentUser;
    if (!user) throw new Error('No authenticated user');

    const credential = EmailAuthProvider.credential(email, password);
    await reauthenticateWithCredential(user, credential);
  }

  // 🔹 Firestore operations (Database)

  // Create/update document
  setDocument(path: string, data: any) {
    return setDoc(doc(getFirestore(), path), data);
  }

  // Read a document
  async getDocument(path: string) {
    return (await getDoc(doc(getFirestore(), path))).data();
  }

  // Get all documents from a collection, optionally with filters or sorting
  getCollectionData(path: string, collectionQuery?: any) {
    const ref = collection(getFirestore(), path);
    return collectionData(query(ref, collectionQuery));
  }

  // Update specific fields of an existing document without fully replacing it
  updateDocument(path: string, data: any): Promise<void> {
    return updateDoc(doc(getFirestore(), path), data);
  }

  // Permanently delete a document from Firestore
  deleteDocument(path: string): Promise<void> {
    return deleteDoc(doc(getFirestore(), path));
  }

  // Delete user from Authentication
  async deleteUser(): Promise<void> {
    const user = getAuth().currentUser;
    if (user) {
      return firebaseDeleteUser(user);
    }
    throw new Error('No authenticated user');
  }

  // 🔹 Change email (requires prior re-authentication)
  async updateEmail(newEmail: string): Promise<void> {
    const user = getAuth().currentUser;
    if (user) {
      return fbUpdateEmail(user, newEmail);
    }
    throw new Error('No authenticated user');
  }

  // 🔹 Change password (requires prior re-authentication)
  async updatePassword(newPassword: string): Promise<void> {
    const user = getAuth().currentUser;
    if (user) {
      return fbUpdatePassword(user, newPassword);
    }
    throw new Error('No authenticated user');
  }

  async getDocumentsByUserRef(collectionName: string) {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) {
      throw new Error('No authenticated user');
    }

    const userRef = doc(getFirestore(), 'users', user.uid);
    const q = query(
      collection(getFirestore(), collectionName),
      where('user.ref', '==', userRef)
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => {
      return {
        id: doc.id,
        ...doc.data(),
      };
    });
  }

  // In your Firebase service (firebase.ts)
  async getAllUsers() {
    const usersRef = collection(getFirestore(), 'users');
    const querySnapshot = await getDocs(usersRef);
    return querySnapshot.docs; // Returns the documents, not the snapshot
  }

  async getHousesByUserId(userId: string) {
    const userRef = doc(getFirestore(), 'users', userId);
    const q = query(
      collection(getFirestore(), 'places'),
      where('user.ref', '==', userRef) // Filters documents in "places" where user.ref matches the user reference
    );

    const querySnapshot = await getDocs(q); // Executes the query and retrieves matching documents
    return querySnapshot.docs.map(doc => {
      return {
        id: doc.id,
        ...doc.data(), // Spread all properties from the document into the final object
      };
    });
  }

  async addHouseToUser(userId: string, number: string) {
    const userRef = doc(getFirestore(), 'users', userId);

    const newHouse = {
      number,
      active: true,
      createdAt: new Date(),
      user: {
        ref: userRef, // Reference to the user in Firebase
      },
    };

    return await addDoc(collection(getFirestore(), 'places'), newHouse);
  }

  async logout() {
    const auth = getAuth();
    return await signOut(auth);
  }
  async getAdmins() {
  const q = query(
    collection(getFirestore(), 'users'),
    where('admin', '==', true)
  );

  const querySnapshot = await getDocs(q);
  const admins: any[] = [];
  
  querySnapshot.forEach((doc) => {
    admins.push({
      id: doc.id,
      ...doc.data()
    });
  });

  return admins;
}

// Obtener mensajes no leídos
async getUnreadMessagesCount(userId: string): Promise<number> {
  const q = query(
    collection(getFirestore(), 'messages'),
    where('to.uid', '==', userId),
    where('read', '==', false)
  );

  const querySnapshot = await getDocs(q);
  return querySnapshot.size;
}
}
