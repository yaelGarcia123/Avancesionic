import { inject, Injectable } from '@angular/core';
import { 
  collection, 
  addDoc, 
  onSnapshot,
  updateDoc,
  doc,
  getDocs,
  getDoc,
  Timestamp
} from '@angular/fire/firestore';
import { getFirestore } from '@angular/fire/firestore';
import { getAuth } from 'firebase/auth';
import { Utils } from './utils';

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private firestore = getFirestore();
constructor(private utilsSvc: Utils) {}
  // Enviar mensaje - FUNCIONA PERFECTO
  async sendMessage(toUid: string, toName: string, toEmail: string, messageText: string): Promise<void> {
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      
      if (!user) throw new Error('Usuario no autenticado');

      const userDoc = await getDoc(doc(this.firestore, 'users', user.uid));
      const userData = userDoc.data();

      const messageData = {
        fromUid: user.uid,
        fromName: userData?.['name'] || user.displayName || 'Usuario',
        fromEmail: user.email || '',
        toUid: toUid,
        toName: toName,
        toEmail: toEmail,
        message: messageText,
        timestamp: Timestamp.now(),
        read: false,
        type: 'user_to_admin'
      };

      // ✅ Esto crea automáticamente la colección "messages"
      await addDoc(collection(this.firestore, 'messages'), messageData);
      
      this.utilsSvc.presentToast({
        message: 'Mensaje enviado al administrador',
        duration: 2000,
        color: 'success'
      });
    } catch (error) {
      console.error('Error enviando mensaje:', error);
      this.utilsSvc.presentToast({
        message: 'Error al enviar mensaje',
        duration: 3000,
        color: 'danger'
      });
    }
  }

  // Obtener mensajes - VERSIÓN SIN CONSULTAS COMPLEJAS
  getMessagesWithAdmin(adminUid: string, onMessagesUpdate: (messages: any[]) => void): () => void {
    const auth = getAuth();
    const user = auth.currentUser;
    
    if (!user) {
      throw new Error('Usuario no autenticado');
    }

    // ✅ Escucha TODOS los mensajes y filtra localmente - NO requiere índice
    const messagesRef = collection(this.firestore, 'messages');
    
    return onSnapshot(messagesRef, (snapshot) => {
      const allMessages: any[] = [];
      
      snapshot.forEach((doc) => {
        const messageData = doc.data();
        
        // Filtrar solo mensajes entre este usuario y el admin
        if (
          (messageData['fromUid'] === user.uid && messageData['toUid'] === adminUid) ||
          (messageData['fromUid'] === adminUid && messageData['toUid'] === user.uid)
        ) {
          allMessages.push({
            id: doc.id,
            ...messageData
          });
        }
      });

      // Ordenar por timestamp
      allMessages.sort((a, b) => {
        const timeA = a.timestamp?.toMillis?.() || 0;
        const timeB = b.timestamp?.toMillis?.() || 0;
        return timeA - timeB;
      });

      onMessagesUpdate(allMessages);
    });
  }

  // Obtener administradores - FUNCIONA PERFECTO
  async getAdmins(): Promise<any[]> {
    try {
      const usersRef = collection(this.firestore, 'users');
      const snapshot = await getDocs(usersRef);
      
      const admins: any[] = [];
      
      snapshot.forEach((doc) => {
        const userData = doc.data();
        if (userData['admin'] === true) {
          admins.push({
            id: doc.id,
            ...userData
          });
        }
      });

      return admins;
    } catch (error) {
      console.error('Error getting admins:', error);
      return [];
    }
  }

  // Obtener mensajes no leídos - VERSIÓN SIMPLIFICADA
  async getUnreadCount(): Promise<number> {
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      
      if (!user) return 0;

      const messagesRef = collection(this.firestore, 'messages');
      const snapshot = await getDocs(messagesRef);
      
      let unreadCount = 0;
      
      snapshot.forEach((doc) => {
        const messageData = doc.data();
        if (messageData['toUid'] === user.uid && messageData['read'] === false) {
          unreadCount++;
        }
      });

      return unreadCount;
    } catch (error) {
      console.error('Error getting unread count:', error);
      return 0;
    }
  }

  // Marcar mensajes como leídos
  async markMessagesAsRead(messageIds: string[]): Promise<void> {
    try {
      for (const messageId of messageIds) {
        await updateDoc(doc(this.firestore, 'messages', messageId), { 
          read: true 
        });
      }
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  }

 // En ChatService
async getAdminMessages(adminUid: string): Promise<any[]> {
  try {
    const messagesRef = collection(this.firestore, 'messages');
    const snapshot = await getDocs(messagesRef);
    
    const messages: any[] = [];
    
    snapshot.forEach((doc) => {
      const messageData = doc.data();
      // Filtrar mensajes donde el admin es el receptor O el emisor
      if (messageData['toUid'] === adminUid || messageData['fromUid'] === adminUid) {
        messages.push({
          id: doc.id,
          ...messageData,
          timestamp: messageData['timestamp']?.toDate() || new Date()
        });
      }
    });

    // Ordenar por timestamp
    return messages.sort((a, b) => b.timestamp - a.timestamp);
  } catch (error) {
    console.error('Error getting admin messages:', error);
    return [];
  }
}
// Mejora el método getUsersWithMessages
async getUsersWithMessages(adminUid: string): Promise<any[]> {
  try {
    const messages = await this.getAdminMessages(adminUid);
    const userMap = new Map<string, any>();

    messages.forEach((msg) => {
      // Determinar el ID del usuario (no admin) en la conversación
      const userId = msg.fromUid === adminUid ? msg.toUid : msg.fromUid;
      const userName = msg.fromUid === adminUid ? msg.toName : msg.fromName;
      const userEmail = msg.fromUid === adminUid ? msg.toEmail : msg.fromEmail;

      if (userId !== adminUid) { // Asegurar que no sea el admin
        if (!userMap.has(userId)) {
          userMap.set(userId, {
            id: userId,
            name: userName || 'Usuario',
            email: userEmail || 'Sin email',
            lastMessage: msg.message,
            timestamp: msg.timestamp,
            unread: msg.toUid === adminUid && !msg.read // Mensajes no leídos para admin
          });
        } else {
          // Actualizar con el mensaje más reciente
          const existingUser = userMap.get(userId);
          if (msg.timestamp > existingUser.timestamp) {
            existingUser.lastMessage = msg.message;
            existingUser.timestamp = msg.timestamp;
            existingUser.unread = msg.toUid === adminUid && !msg.read;
          }
        }
      }
    });

    return Array.from(userMap.values()).sort((a, b) => b.timestamp - a.timestamp);
  } catch (error) {
    console.error('Error getting users with messages:', error);
    return [];
  }
}
}