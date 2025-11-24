// src/app/models/place.model.ts

export interface Place {
  id: string;
  number: string;
  active: boolean;
  user?: {
    name?: string;
    ref?: any;
  };

  // 🔹 LOS NUEVOS CAMPOS
  fraccionamiento?: string;
  fraccionamientoId?: string;

  createdAt?: any;
}
