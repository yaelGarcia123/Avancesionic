import { inject, Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFirestore } from '@angular/fire/compat/firestore';

import {updateDoc,deleteDoc, getFirestore,setDoc,doc,getDoc,collection,collectionData,query } from '@angular/fire/firestore';
import { deleteUser as firebaseDeleteUser } from "firebase/auth";

import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  createUserWithEmailAndPassword,
  updateProfile,
  updateCurrentUser,
} from 'firebase/auth';
import { user } from '../models/user.model';

@Injectable({
  
  providedIn: 'root',
})
export class Firebase {
  private auth = inject(AngularFireAuth);
  firestone=inject(AngularFirestore)

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

  //  función para cerrar sesión
  updateUser(displayName: string) {
    return updateProfile(getAuth().currentUser, { displayName });
  }

    //  Base de datos
  setDocument(path:string ,data:any){
  return setDoc(doc(getFirestore(), path),data)

  }

//Obtener un documento 
async getDocument(path: string) {
  return (await getDoc(doc(getFirestore(), path))).data();
}
//obtener los documentos de una coleccion 
getCollectionData(path:string,collectionQuery?:any){
const ref=collection(getFirestore(), path)
return collectionData(query(ref,collectionQuery))
}

updateDocument(path: string, data: any): Promise<void> {
  return updateDoc(doc(getFirestore(), path), data);
}

deleteDocument(path: string): Promise<void> {
  return deleteDoc(doc(getFirestore(), path));
}

// Para eliminar usuario de Authentication (requiere reautenticación)
async deleteUser(): Promise<void> {
  const user = getAuth().currentUser;
  if (user) {
    return firebaseDeleteUser(user); // ✅ usar alias de Firebase
  }
  throw new Error('No hay usuario autenticado');
}
}
