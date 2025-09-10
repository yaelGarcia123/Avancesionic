// src/app/models/place.model.ts

export interface Place {
  id?: string;
  number: string;
  user: {
    name: string;
    ref: any; // DocumentReference
  }}
