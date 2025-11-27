export interface UserSystem {
  id: string;
  email: string;
  password: string;
  name?: string;
  admin: boolean;
  manager: boolean; // Agrega esta propiedad
  uid?: string;
}