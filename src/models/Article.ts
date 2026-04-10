export interface Article {
  _id?: string;
  nom: string;
  prix: number;
  categorie: string;
  stock: number;
  vendu: number;
  atelierId: string;

  synced?: number;
}
