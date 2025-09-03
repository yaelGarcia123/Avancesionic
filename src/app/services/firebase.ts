import { inject, Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFirestore } from '@angular/fire/compat/firestore';

import { getFirestore,setDoc,doc } from '@angular/fire/firestore';

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



}
