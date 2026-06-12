export interface TipoTrabajo {
  codigo: string;
  descripcion: string;
  color: string;
}

export const TIPOS_TRABAJO: TipoTrabajo[] = [
  { codigo: 'DEV',    descripcion: 'Desarrollo',         color: '#2196F3' },
  { codigo: 'TEST',   descripcion: 'Testing',            color: '#4CAF50' },
  { codigo: 'ANAL',   descripcion: 'Análisis',           color: '#FF9800' },
  { codigo: 'REV',    descripcion: 'Revisión de código', color: '#9C27B0' },
  { codigo: 'DESIGN', descripcion: 'Diseño',             color: '#E91E63' },
  { codigo: 'ADMIN',  descripcion: 'Administrativo',     color: '#607D8B' },
  { codigo: 'MEET',   descripcion: 'Reunión',            color: '#795548' },
  { codigo: 'OTHER',  descripcion: 'Otros',              color: '#9E9E9E' },
];

export const TIPOS_TRABAJO_MAP = new Map<string, TipoTrabajo>(
  TIPOS_TRABAJO.map(t => [t.codigo, t])
);
