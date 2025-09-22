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


getAuth(){
  return getAuth();
}

  getUser() {
    return this.auth.currentUser;
  }

  //  función para acceder
  signIn(user: user) {
    return signInWithEmailAndPassword(getAuth(), user.email, user.password);
  }

  //  función para registrar
  signUp(user: user) {
    return createUserWithEmailAndPassword(getAuth(), user.email, user.password);
  }

  //  función para actualizar perfil
  updateUser(displayName: string) {
    return updateProfile(getAuth().currentUser, { displayName });
  }

  // Reautenticar al usuario
  async reauthenticateUser(email: string, password: string): Promise<void> {
    const user = getAuth().currentUser;
    if (!user) throw new Error('No hay usuario autenticado');

    const credential = EmailAuthProvider.credential(email, password);
    await reauthenticateWithCredential(user, credential);
  }

  //  Operaciones de firebase (Base de datos)

  //crear /actualizar documento
  setDocument(path: string, data: any) {
    return setDoc(doc(getFirestore(), path), data);
  }
  //leer el documento
  async getDocument(path: string) {
    return (await getDoc(doc(getFirestore(), path))).data();
  }
  //Obtener todos los documentos de una colección, opcionalmente con filtros u ordenamiento.
  getCollectionData(path: string, collectionQuery?: any) {
    const ref = collection(getFirestore(), path);
    return collectionData(query(ref, collectionQuery));
  }
  //Actualizar campos específicos de un documento existente sin reemplazarlo completamente.
  updateDocument(path: string, data: any): Promise<void> {
    return updateDoc(doc(getFirestore(), path), data);
  }
  //Eliminar permanentemente un documento de Firestore.

  deleteDocument(path: string): Promise<void> {
    return deleteDoc(doc(getFirestore(), path));
  }



  // Para eliminar usuario de Authentication
  async deleteUser(): Promise<void> {
    const user = getAuth().currentUser;
    if (user) {
      return firebaseDeleteUser(user);
    }
    throw new Error('No hay usuario autenticado');
  }

  // 🔹 Cambiar email (requiere reautenticación previa)
  async updateEmail(newEmail: string): Promise<void> {
    const user = getAuth().currentUser;
    if (user) {
      return fbUpdateEmail(user, newEmail);
    }
    throw new Error('No hay usuario autenticado');
  }

  // 🔹 Cambiar contraseña (requiere reautenticación previa)
  async updatePassword(newPassword: string): Promise<void> {
    const user = getAuth().currentUser;
    if (user) {
      return fbUpdatePassword(user, newPassword);
    }
    throw new Error('No hay usuario autenticado');
  }

async getDocumentsByUserRef(collectionName: string) {
  const auth = getAuth();
  const user = auth.currentUser;
  if (!user) {
    throw new Error('No hay usuario autenticado');
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
      ...doc.data()
    };
  });
}

// En tu servicio Firebase (firebase.ts)
async getAllUsers() {
  const usersRef = collection(getFirestore(), 'users');
  const querySnapshot = await getDocs(usersRef);
  return querySnapshot.docs; // Devuelve los documentos, no el snapshot
}

async getHousesByUserId(userId: string) {
  const userRef = doc(getFirestore(), 'users', userId);
  const q = query(
    collection(getFirestore(), 'places'),
    where('user.ref', '==', userRef)//filtra los documentos de places donde el campo user.ref sea igual a la referencia del usuario que obtuvimos arriba.
  );
  
  const querySnapshot = await getDocs(q);// Ejecuta la consulta y obtiene los documentos que coinciden con el filtro.
  return querySnapshot.docs.map(doc => {
    return {
      id: doc.id,
      ...doc.data()//metes todas las propiedades del documento al objeto final.
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
      ref: userRef, // referencia al usuario en Firebase
    },
  };

  return await addDoc(collection(getFirestore(), 'places'), newHouse);
}

async logout() {
  const auth = getAuth();
  return await signOut(auth);
}



}
