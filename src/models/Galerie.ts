export interface Galerie {
  _id?: string;
  filename: string;
  titre?: string | null;
  categorie: string;
  atelierId: string;

  synced?: number;
}
