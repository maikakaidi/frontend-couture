export interface Mesure {
  _id?: string;
  type: string;
  valeur: string;
  clientId: string;
  atelierId: string;

  synced?: number;
}
