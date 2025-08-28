import { inject, Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';

import { getAuth, signInWithEmailAndPassword, signOut, createUserWithEmailAndPassword,updateProfile, updateCurrentUser } from "firebase/auth";
import { user } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class Firebase {
  
private auth = inject(AngularFireAuth);

  // 👉 función para acceder
  signIn(user: user) {
    return signInWithEmailAndPassword(getAuth(), user.email, user.password);
  }

  // 👉 función para registrar
  signUp(user: user) {
    return createUserWithEmailAndPassword(getAuth(), user.email, user.password);
  }

  // 👉 función para cerrar sesión
 updateUser(displayName:string){
  return updateProfile(getAuth().currentUser,{displayName})
 }

}
