export interface Client {
  _id?: string;
  nom: string;
  telephone: string;
  adresse?: string;
  atelierId: string;

  createdAt?: string;
  updatedAt?: string;

  synced?: number; // ⭐ important pour sync
}
