export interface Advance {
  amount: number;
  date: string;
}

export interface Employee {
  _id?: string;
  nom: string;
  poste: string;
  salaire: number;
  advances: Advance[];
  atelierId: string;

  synced?: number;
}
