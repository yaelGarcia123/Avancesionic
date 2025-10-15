import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  collection,
  addDoc,
  serverTimestamp,
  doc,
  query,
  where,
  orderBy,
  onSnapshot,
} from '@angular/fire/firestore';
import { getAuth } from 'firebase/auth';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  firestore = inject(Firestore);

  // 📨 Enviar mensaje
  async sendMessage(toUid: string, message: string) {
    const auth = getAuth();
    const fromUid = auth.currentUser?.uid;

    if (!fromUid) throw new Error('No user authenticated');

    const messagesRef = collection(this.firestore, 'messages');

    return await addDoc(messagesRef, {
      fromUserRef: doc(this.firestore, `users/${fromUid}`),
      toUserRef: doc(this.firestore, `users/${toUid}`),
      message,
      timestamp: serverTimestamp(),
      read: false,
    });
  }

  // 📜 Obtener mensajes entre dos usuarios
  getMessages(uid1: string, uid2: string, callback: (msgs: any[]) => void) {
    const messagesRef = collection(this.firestore, 'messages');

    const q = query(
      messagesRef,
      where('fromUserRef', 'in', [
        doc(this.firestore, `users/${uid1}`),
        doc(this.firestore, `users/${uid2}`)
      ]),
      orderBy('timestamp', 'asc')
    );

    // Escucha en tiempo real
    onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data()
      }));
      callback(msgs);
    });
  }
}
