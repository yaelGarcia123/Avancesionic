export interface HomeownerPivot {
  userId: string;
  name: string;
  email: string;
  totalHouses: number;
  activeHouses: number;
  houses: {
    number: string;
    active: boolean;
    createdAt: Date;
  }[];
}
