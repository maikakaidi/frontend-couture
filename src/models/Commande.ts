export interface Commande {
  _id?: string;
  clientId: string;
  atelierId: string;

  description: string;
  montant: number;
  acompte: number;

  image?: string | null;
  rdv: string;

  createdAt?: string;
  updatedAt?: string;

  synced?: number;
}
