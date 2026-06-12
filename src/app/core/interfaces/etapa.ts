export interface Etapa {
  id?: string;
  nombre: string;
  rolPreferido?: string;
  activo?: boolean;
  deAutoriza?: boolean;
  deArchivo?: boolean;

  categoriaSugeridaCodigo?: string | null;

  requisitos?: Etapa_requisito[];
  // eventoEtapas?: EventoEtapa[];
  // rollbackDe?: EventoEtapa[];
}

export interface Etapa_requisito {
  id?: number;
  etapaId: number;
  codigo: string;
  descripcion?: string;
  obligatorio: boolean;
  tipo: Tipo_requisito;

  etapa?:Etapa;
  // eventoRequisitos?: evento_requisitos[];
}

export enum Tipo_requisito {
  text = 'text',
  numeric = 'numeric',
  file = 'file',
  boolean = 'boolean',
  date = 'date',
}
