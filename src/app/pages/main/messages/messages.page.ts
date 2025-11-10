import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { ChatService } from 'src/app/services/chatservice';
import { Utils } from 'src/app/services/utils';
import { getAuth } from 'firebase/auth';

@Component({
  selector: 'app-messages', // Nombre del componente (etiqueta HTML)
  templateUrl: './messages.page.html', // Archivo de plantilla (vista)
  styleUrls: ['./messages.page.scss'], // Archivo de estilos del componente
  standalone: false,
})
export class MessagesPage implements OnInit, OnDestroy {
  currentUserId: string | null = null;

  // ✅ Inyección de servicios usando la función inject()
  private chatSvc = inject(ChatService); // Servicio para manejar chats y mensajes
  private utilsSvc = inject(Utils); // Servicio de utilidades (toasts, loaders, etc.)

  // ✅ Variables del componente
  messages: any[] = []; // Lista de mensajes cargados desde la base de datos
  newMessage: string = ''; // Mensaje que el usuario está escribiendo
  admin: any = null; // Información del administrador con el que se chatea
  loading = true; // Indicador de carga (muestra spinner o similar)
  private unsubscribe?: () => void; // Función para detener la escucha de mensajes en tiempo real

  // ✅ Se ejecuta al iniciar el componente
  async ngOnInit() {
    const user = getAuth().currentUser;
    this.currentUserId = user ? user.uid : null;
    await this.loadAdmin(); // Llama a la función para cargar el administrador
  }

  // ✅ Se ejecuta al destruir el componente (por ejemplo, al salir de la página)
  ngOnDestroy() {
    if (this.unsubscribe) {
      this.unsubscribe(); // Cancela la suscripción a los mensajes en tiempo real
    }
  }

  // ✅ Carga el primer administrador disponible en la base de datos
  async loadAdmin() {
    try {
      const admins = await this.chatSvc.getAdmins(); // Obtiene la lista de administradores desde el servicio
      if (admins.length > 0) {
        this.admin = admins[0]; // Toma el primer administrador
        this.loadMessages(); // Carga los mensajes con ese administrador
      } else {
        this.loading = false; // Deja de cargar si no hay admin
        this.utilsSvc.presentToast({
          message: 'No se encontró administrador',
          duration: 3000,
          color: 'warning',
        });
      }
    } catch (error) {
      // Maneja errores si la carga del admin falla
      console.error('Error loading admin:', error);
      this.loading = false;
      this.utilsSvc.presentToast({
        message: 'Error cargando administrador',
        duration: 3000,
        color: 'danger',
      });
    }
  }

  // ✅ Escucha y carga los mensajes en tiempo real con el administrador
  loadMessages() {
    if (!this.admin) return; // Si no hay admin, no hace nada

    // Se suscribe a los mensajes en tiempo real
    this.unsubscribe = this.chatSvc.getMessagesWithAdmin(
      this.admin.id, // ID del administrador
      (messages: any[]) => {
        this.messages = messages; // Actualiza la lista de mensajes
        this.loading = false; // Quita el estado de carga
        this.markMessagesAsRead(); // Marca los mensajes como leídos

        // Desplaza automáticamente al final del chat
        setTimeout(() => {
          this.scrollToBottom();
        }, 100);
      }
    );
  }

  // ✅ Envía un nuevo mensaje al administrador
  async sendMessage() {
    if (!this.newMessage.trim() || !this.admin) return; // No envía si está vacío o no hay admin

    try {
      await this.chatSvc.sendMessage(
        this.admin.id, // ID del admin receptor
        this.admin.name, // Nombre del admin
        this.admin.email, // Email del admin
        this.newMessage.trim() // Contenido del mensaje
      );
      this.newMessage = ''; // Limpia el input después de enviar
    } catch (error) {
      console.error('Error sending message:', error);
    }
  }

  // ✅ Marca los mensajes no leídos como leídos (para el usuario actual)
  async markMessagesAsRead() {
    const unreadMessages = this.messages
      .filter((msg) => !msg.read && msg.toUid === getAuth().currentUser?.uid) // Filtra los no leídos enviados al usuario
      .map((msg) => msg.id) // Obtiene los IDs de los mensajes
      .filter((id): id is string => !!id); // Asegura que no haya valores nulos

    if (unreadMessages.length > 0) {
      await this.chatSvc.markMessagesAsRead(unreadMessages); // Marca como leídos en la BD
    }
  }

  // ✅ Desplaza automáticamente el scroll al final de la lista de mensajes
  scrollToBottom() {
    const messagesContainer = document.querySelector('.messages-list');
    if (messagesContainer) {
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
  }

  // ✅ Maneja el evento de "pull to refresh" (arrastrar hacia abajo para recargar)
  handleRefresh(event: any) {
    this.loadMessages(); // Recarga los mensajes
    setTimeout(() => {
      event.target.complete(); // Finaliza la animación de recarga
    }, 1000);
  }
}
