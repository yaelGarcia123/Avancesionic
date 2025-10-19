export interface Message {
  id?: string;
  from: {
    uid: string;
    name: string;
    email: string;
  };
  to: {
    uid: string;
    name: string;
    email: string;
  };
  message: string;
  timestamp: any;
  read: boolean;
  type: 'user_to_admin' | 'admin_to_user';
  conversationId?: string; // Campo opcional para la nueva versión
}