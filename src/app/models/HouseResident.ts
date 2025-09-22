import { DocumentReference } from "firebase/firestore";

export interface HouseResident {
  userRef: DocumentReference;   // referencia a users/{uid}
  houseRef: DocumentReference;  // referencia a houses/{houseId}
  role: "propietario" | "residente"; // opcional
  createdAt: Date;
}
