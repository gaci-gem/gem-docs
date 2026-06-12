export interface Espacio {
  id: string;
  nombre: string;
  descripcion: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export type EspacioCreate = Pick<Espacio, 'nombre' | 'descripcion'>;