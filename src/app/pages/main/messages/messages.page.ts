import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { ChatService } from 'src/app/services/chatservice';
import { Utils } from 'src/app/services/utils';
import { getAuth } from 'firebase/auth';

@Component({
  selector: 'app-messages',
  templateUrl: './messages.page.html',
  styleUrls: ['./messages.page.scss'],
  standalone: false
})
export class MessagesPage implements OnInit, OnDestroy {
  private chatSvc = inject(ChatService);
  private utilsSvc = inject(Utils);

  messages: any[] = [];
  newMessage: string = '';
  admin: any = null;
  loading = true;
  private unsubscribe?: () => void;

  async ngOnInit() {
    await this.loadAdmin();
  }

  ngOnDestroy() {
    if (this.unsubscribe) {
      this.unsubscribe();
    }
  }

  async loadAdmin() {
    try {
      const admins = await this.chatSvc.getAdmins();
      if (admins.length > 0) {
        this.admin = admins[0];
        this.loadMessages();
      } else {
        this.loading = false;
        this.utilsSvc.presentToast({
          message: 'No se encontró administrador',
          duration: 3000,
          color: 'warning'
        });
      }
    } catch (error) {
      console.error('Error loading admin:', error);
      this.loading = false;
      this.utilsSvc.presentToast({
        message: 'Error cargando administrador',
        duration: 3000,
        color: 'danger'
      });
    }
  }

  loadMessages() {
    if (!this.admin) return;

    this.unsubscribe = this.chatSvc.getMessagesWithAdmin(
      this.admin.id,
      (messages: any[]) => {
        this.messages = messages;
        this.loading = false;
        this.markMessagesAsRead();
        
        // Scroll al final de los mensajes
        setTimeout(() => {
          this.scrollToBottom();
        }, 100);
      }
    );
  }

  async sendMessage() {
    if (!this.newMessage.trim() || !this.admin) return;

    try {
      await this.chatSvc.sendMessage(
        this.admin.id,
        this.admin.name,
        this.admin.email,
        this.newMessage.trim()
      );
      this.newMessage = '';
    } catch (error) {
      console.error('Error sending message:', error);
    }
  }

  async markMessagesAsRead() {
    const unreadMessages = this.messages
      .filter(msg => !msg.read && msg.toUid === getAuth().currentUser?.uid)
      .map(msg => msg.id)
      .filter((id): id is string => !!id);

    if (unreadMessages.length > 0) {
      await this.chatSvc.markMessagesAsRead(unreadMessages);
    }
  }

  scrollToBottom() {
    const messagesContainer = document.querySelector('.messages-list');
    if (messagesContainer) {
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
  }

  handleRefresh(event: any) {
    this.loadMessages();
    setTimeout(() => {
      event.target.complete();
    }, 1000);
  }
}