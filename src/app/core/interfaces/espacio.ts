export interface Espacio {
  id: string;
  nombre: string;
  descripcion: string | null;
  parentId?: string | null;  // null = raíz
  children?: Espacio[];      // sub-espacios (devuelto por getById cuando los hay)
  createdAt: Date;
  updatedAt: Date;
}

export type EspacioCreate = Pick<Espacio, 'nombre' | 'descripcion' | 'parentId'> & { parentId?: string | null };