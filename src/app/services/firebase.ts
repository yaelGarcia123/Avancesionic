import { inject, Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import {
  addDoc,
  collection,
  collectionData,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  Firestore,
  query,
  setDoc,
  updateDoc,
  getFirestore,
  where,
} from '@angular/fire/firestore';
import { deleteUser as firebaseDeleteUser } from 'firebase/auth';

import {
  updateEmail as fbUpdateEmail,
  updatePassword as fbUpdatePassword,
  getAuth,
  signOut,
} from 'firebase/auth';
import { UserSystem } from '../models/UserSystem';

@Injectable({
  providedIn: 'root',
})
export class FirebaseServ {
  firestore = inject(AngularFirestore);

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
    return querySnapshot.docs.map((doc) => {
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
    return querySnapshot.docs.map((doc) => {
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
        ...doc.data(),
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

  async getUserByUid(uid: string): Promise<UserSystem | null> {
    const userDoc = await getDoc(doc(getFirestore(), `users/${uid}`));
    if (userDoc.exists()) {
      return userDoc.data() as UserSystem;
    } else {
      return null;
    }
  }
}
