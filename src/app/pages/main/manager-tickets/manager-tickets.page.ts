import { Component, OnInit } from '@angular/core';
import { Utils } from 'src/app/services/utils';
import { FirebaseServ } from 'src/app/services/firebase';

@Component({
  selector: 'app-manager-tickets',
  templateUrl: './manager-tickets.page.html',
  styleUrls: ['./manager-tickets.page.scss'],
  standalone: false,
})
export class ManagerTicketsPage implements OnInit {
  tickets: any[] = [];
  filteredTickets: any[] = [];
  loading: boolean = true;
  
  // Filtros
  filterStatus: 'todos' | 'abierto' | 'cerrado' = 'todos';
  
  // Estadísticas
  totalTickets: number = 0;
  abiertosCount: number = 0;
  cerradosCount: number = 0;

  constructor(
    private utils: Utils,
    private firebaseSvc: FirebaseServ
  ) {}

  async ngOnInit() {
    await this.loadTickets();
  }

  async loadTickets() {
    this.loading = true;
    try {
      console.log('🔍 Cargando tickets desde Firestore...');
      
      // Método temporal: obtener todos los documentos de tickets_houses
      const ticketsData: any = await this.getAllTicketsDirect();
      
      this.tickets = ticketsData || [];
      
      console.log(`📊 Se encontraron ${this.tickets.length} tickets`);
      console.log('✅ Tickets cargados:', this.tickets);

      this.updateStats();
      this.applyFilters();
      
    } catch (error) {
      console.error('❌ Error cargando tickets:', error);
      this.utils.presentToast({
        message: 'Error al cargar tickets',
        color: 'danger',
        duration: 2000
      });
    } finally {
      this.loading = false;
    }
  }

  // Método temporal para obtener tickets directamente
  private async getAllTicketsDirect(): Promise<any[]> {
    return new Promise(async (resolve, reject) => {
      try {
        // Importar funciones de Firebase directamente
        const { getFirestore, collection, getDocs, query, orderBy } = await import('@angular/fire/firestore');
        
        const db = getFirestore();
        const ticketsRef = collection(db, 'tickets_houses');
        const q = query(ticketsRef, orderBy('createdAt', 'desc'));
        
        const querySnapshot = await getDocs(q);
        const tickets = querySnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            createdAt: data['createdAt']?.toDate?.() || new Date(),
            closedAt: data['closedAt']?.toDate?.() || null
          };
        });
        
        resolve(tickets);
      } catch (error) {
        reject(error);
      }
    });
  }

  updateStats() {
    this.totalTickets = this.tickets.length;
    this.abiertosCount = this.tickets.filter(t => t.status === 'abierto').length;
    this.cerradosCount = this.tickets.filter(t => t.status === 'cerrado').length;
  }

  applyFilters() {
    if (this.filterStatus === 'todos') {
      this.filteredTickets = [...this.tickets];
    } else {
      this.filteredTickets = this.tickets.filter(ticket => ticket.status === this.filterStatus);
    }
  }

  onFilterChange() {
    this.applyFilters();
  }

  async closeTicket(ticket: any) {
    const alert = await this.utils.alertCtrl.create({
      header: 'Cerrar Ticket',
      message: '¿Estás seguro de que deseas cerrar este ticket?',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Cerrar',
          handler: async () => {
            await this.confirmCloseTicket(ticket);
          }
        }
      ]
    });

    await alert.present();
  }

  async confirmCloseTicket(ticket: any) {
    try {
      // Importar funciones de Firebase directamente para actualizar
      const { getFirestore, doc, updateDoc } = await import('@angular/fire/firestore');
      
      const db = getFirestore();
      const ticketRef = doc(db, 'tickets_houses', ticket.id);
      
      await updateDoc(ticketRef, {
        status: 'cerrado',
        closedAt: new Date()
      });

      // Actualizar el ticket localmente
      ticket.status = 'cerrado';
      ticket.closedAt = new Date();
      
      this.updateStats();
      this.applyFilters();

      this.utils.presentToast({
        message: 'Ticket cerrado correctamente',
        color: 'success',
        duration: 2000
      });

    } catch (error) {
      console.error('Error cerrando ticket:', error);
      this.utils.presentToast({
        message: 'Error al cerrar ticket',
        color: 'danger',
        duration: 2000
      });
    }
  }

  getTicketIcon(area: string): string {
    const icons: { [key: string]: string } = {
      'Técnica': 'construct-outline',
      'Atención a clientes': 'headset-outline',
      'Mantenimiento': 'hammer-outline',
      'Seguridad': 'shield-checkmark-outline',
      'Otro': 'help-circle-outline'
    };
    return icons[area] || 'document-text-outline';
  }

  getStatusColor(status: string): string {
    return status === 'abierto' ? 'warning' : 'success';
  }

  formatDate(date: any): string {
    if (!date) return 'N/A';
    
    if (date instanceof Date) {
      return date.toLocaleDateString('es-MX', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
    
    // Si es un timestamp de Firestore
    if (date.toDate) {
      return date.toDate().toLocaleDateString('es-MX', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
    
    return 'Fecha inválida';
  }

  // Recargar tickets
  async refreshTickets(event: any) {
    await this.loadTickets();
    event.target.complete();
  }
}