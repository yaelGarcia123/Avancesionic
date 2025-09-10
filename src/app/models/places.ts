// src/app/models/place.model.ts

export interface Place {
  id?: string;
  number: string;
  activado:boolean;
  user: {
    name: string;
    ref: any; // DocumentReference
  }}
