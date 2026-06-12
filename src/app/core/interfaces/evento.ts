import { EstadosEvento } from '@/app/constants/evento_estados';
import { TipoEventoTimelineEtapa } from './tipo-evento';
import { ACCIONES } from '@/app/constants/actividad_acciones';
import { Etapa, Etapa_requisito } from './etapa';
// import {
//   EstimacionDetalle,
//   EventoV2Requisito,
// } from '@/app/views/evento/evento/components/evento-v2-details-files/evento-v2-details-files';

export function formatEventoNumero(
  tipoCodigo: string,
  numero: number,
  pad: number = 3,
): string {
  return `${tipoCodigo}-${numero.toString().padStart(pad, '0')}`;
}

// Evento completo con datos enriquecidos
// export interface EventoCompleto {
//   id: string;
//   tipoCodigo: string;
//   numero: number;
//   titulo: string;
//   cerrado: boolean;
//   etapaActual: number;
//   clienteId: number;
//   productoId: number;
//   usuarioAltaId: string;
//   estimacion: number;
//   moduloCodigo: string;
//   activo: boolean;
//   prioridad: number;
//   createdAt: string;
//   updatedAt: string;
//   deletedAt: string | null;
//   cliente: ClienteEvento;
//   modulo: ModuloEvento;
//   producto: ProductoEvento;
//   tipo: TipoEvento;
//   usuarioAlta: UsuarioEvento;
//   usuarioActual: UsuarioEvento;
//   _count: EventoCount;
//   etapaActualData: EventoEtapa;
//   etapaSiguiente: EventoEtapa | null;
//   etapaAnterior: EventoEtapa | null;
//   observadores?: UsuarioEvento[];
// }

export interface UsuarioEvento {
  id: string;
  nombre: string;
  apellido: string;
  usuario: string;
  color: string;
}
// Evento completo con datos enriquecidos
export interface EventoCompleto extends Evento {
  tipo: EventoTipo;
  cliente: EventoCliente;
  producto: EventoProducto;
  usuarioAlta: EventoUsuario;
  usuarioActual: EventoUsuario;
  modulo: EventoModulo;
  proyecto: EventoProyecto;

  registrosHora: RegistroHora[];
  auditorias: VidaEvento[];
  eventosAdicion: EventoAdicion[];
  requisitos: Evento_requisito[];
  observadores: UsuarioEvento[];
  documentacion: EventoDocumentacion[];

  etapaActualData: EventoEtapa;
  etapaSiguiente: EventoEtapa | null;
  etapaAnterior: EventoEtapa | null;

  registroTiempo?: RegistroHora;

  categoriaSugerida?: {
    codigo: string;
    descripcion: string;
    color: string;
    activo?: boolean;
  } | null;
}

export interface EventoDocumentacion {
  id: string;
  eventoId: string;
  proveedor: string;
  externalId: string;
  externalUrl: string;
  titulo: string;
  tipo?: string;
  esPrincipal: boolean;
  estado?: string;
  metadata?: string;
  createdAt: Date;
  updatedAt: Date;
}

/** Cliente enriquecido para EventoCompleto */
export interface EventoCliente {
  id: number;
  sigla: string;
  nombre: string;
  activo: boolean;
  critico: boolean;
}

export interface EventoProyecto {
  id: number;
  sigla: string;
  nombre: string;
  activo: boolean;
  critico: boolean;
  clienteIds?: number[];
  clientes?: EventoCliente[];
}

/** Módulo enriquecido para EventoCompleto */
export interface EventoModulo {
  codigo: string;
  nombre: string;
  padreCodigo: string | null;
  activo: boolean;
}

/** Producto enriquecido para EventoCompleto */
export interface EventoProducto {
  id: number;
  sigla: string;
  nombre: string;
  entornoCodigo: string;
  activo: boolean;
  critico: boolean;
}

/** Tipo enriquecido para EventoCompleto */
export interface EventoTipo {
  codigo: string;
  descripcion: string;
  activo: boolean;
  color: string;
  propio?: boolean;
}

/** Usuario enriquecido para EventoCompleto */
export interface EventoUsuario {
  id: string;
  nombre: string;
  apellido: string;
  usuario: string;
  color: string;
}

/** Contador de relaciones para EventoCompleto */
export interface EventoCount {
  registrosHora: number;
  auditorias: number;
  eventosAdicion: number;
}

export enum TipoRequisito {
  Text = 'text',
  Numeric = 'numeric',
  File = 'file',
  Boolean = 'boolean',
  Date = 'date',
}

/** Etapa enriquecida para EventoCompleto */
export interface Requisito {
  id: number;
  tipo: TipoRequisito;
  codigo: string;
  descripcion: string;
  obligatorio?: boolean;
}

export interface EventoEtapa {
  id: number;
  nombre: string;
  rolPreferido: string;
  activo: boolean;
  deArchivo?: boolean;
  deAutoriza?: boolean;
  puedeContinuar?: boolean;
  etapaFinal?: boolean;
  requisitosFaltantes?: Requisito[];
  requisitos?: Requisito[];
}

// Evento base
export interface Evento {
  id?: string | null;
  tipoCodigo: string;
  numero: number;
  titulo: string;
  cerrado: boolean;
  estado?: EstadosEvento;
  etapaActual: number;
  usuarioAltaId: string;
  usuarioActualId?: string;
  descripcion?: string;
  facEventoCerr: boolean;
  estimacion?: number;
  clienteId: number;
  proyectoId: number;
  productoId: number;
  moduloCodigo: string;

  prioridadUsu: number;
  prioridadCal?: number;
  prioridadFin?: number;

  fechaInicio?: string;
  fechaFinEst?: string;
  fechaFinReal?: string;
  fechaEntrega?: string;

  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string;

  comentario?: string;
  evento?: string;
  eventoSearch?: string;
}

/** Registro de horas asociadas a un evento */
export interface RegistroHora {}

/*
{
    "id": 15,
    "eventoId": "df3156c7-4a22-45a4-b425-4205f0c21abf",
    "etapaNumero": 5,
    "usuarioId": "a0ae084e-2631-4a13-9c68-7f69fc0e5b6a",
    "fecha": "2026-01-09T16:04:57.233Z",
    "adicionId": 2,
    "accion": "COMENTARIO",
    "adicion": {
      "id": 2,
      "eventoId": "df3156c7-4a22-45a4-b425-4205f0c21abf",
      "tipo": "COMENTARIO",
      "activo": true,
      "createdAt": "2026-01-09T16:04:55.350Z",
      "comentario": {
        "id": 2,
        "eventoAdicionId": 2,
        "texto": "Hola @frossi, necesito que revises esto con @admin."
      },
      "archivo": null,
      "menciones": [
        {
          "id": 2,
          "eventoAdicionId": 2,
          "usuarioId": "6eeb1e21-05f9-4c82-a9bc-7ae2044830d9",
          "fecha": "2026-01-09T16:04:56.436Z",
          "usuario": {
            "id": "6eeb1e21-05f9-4c82-a9bc-7ae2044830d9",
            "nombre": "Florencia Abigail",
            "apellido": "Rossi",
            "usuario": "FROSSI",
            "color": "#AA7B38"
          }
        }
      ]
    },
    "usuario": {
      "nombre": "Julian",
      "apellido": "Torossian",
      "usuario": "Jtorossian",
      "color": "#DF43A2"
    }
  }
*/

/** Auditoría de vida de un evento */
export interface VidaEvento {
  id?: number;
  eventoId: string;
  etapaNumero: number;
  usuarioId: string;
  fecha: Date;
  adicionId?: number;
  accion: string;
  adicion?: EventoAdicion;
  usuario?: EventoUsuario;
}

/*
"adicion": {
  "id": 2,
  "eventoId": "df3156c7-4a22-45a4-b425-4205f0c21abf",
  "tipo": "COMENTARIO",
  "activo": true,
  "createdAt": "2026-01-09T16:04:55.350Z",
  "comentario": {
    "id": 2,
    "eventoAdicionId": 2,
    "texto": "Hola @frossi, necesito que revises esto con @admin."
  },
  "archivo": null,
  "menciones": [
    {
      "id": 2,
      "eventoAdicionId": 2,
      "usuarioId": "6eeb1e21-05f9-4c82-a9bc-7ae2044830d9",
      "fecha": "2026-01-09T16:04:56.436Z",
      "usuario": {
        "id": "6eeb1e21-05f9-4c82-a9bc-7ae2044830d9",
        "nombre": "Florencia Abigail",
        "apellido": "Rossi",
        "usuario": "FROSSI",
        "color": "#AA7B38"
      }
    }
  ]
},
*/

/** Adición de información o archivos a un evento */
export interface EventoAdicion {
  id?: number;
  eventoId: string;
  tipo: string;
  comentario?: {
    id?: number;
    eventoAdicionId?: number;
    texto: string;
  };
  archivo?: {
    adjFile?: boolean;
    pathFile?: string;
    mimeType?: string;
    nameFile?: string;
  };
  activo?: boolean;

  auditorias?: VidaEvento[];
  menciones?: ComentarioMencion[];
}

export interface ComentarioMencion {
  id: number;
  eventoAdicionId: number;
  usuarioId: string;
  fecha: string;
  usuario: EventoUsuario;
}

/** Comentario circular entre usuarios y eventos */
export interface CircularEvento {
  eventoId: string;
  usuarioId?: string;
  comentario: string;
}

export interface Evento_requisito {
  eventoId: string;
  requisitoId: number;

  valorTexto?: string;
  valorNumero?: number;
  valorFecha?: Date;
  valorBooleano?: boolean;
  valor?: any;
  url?: string;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;

  // evento          evento      @relation(fields: [eventoId], references: [id])
  requisito?: Etapa_requisito;
}

export interface Evento_requisito_completo {
  etapa: EventoEtapa | Etapa;
  requisito: Etapa_requisito;
  obligatorio: boolean;
  cumplido: boolean;
  cumplimiento: Evento_requisito;
}

export const eventoFromEventoCompleto = (evento: EventoCompleto): Evento => {
  return {
    id: evento.id,
    tipoCodigo: evento.tipoCodigo,
    numero: evento.numero,
    titulo: evento.titulo,
    cerrado: evento.cerrado,
    // estado: evento.estado,
    etapaActual: evento.etapaActual,
    usuarioAltaId: evento.usuarioAltaId,
    usuarioActualId: evento.usuarioActualId,
    descripcion: evento.descripcion,
    facEventoCerr: evento.facEventoCerr,
    estimacion: evento.estimacion,
    clienteId: evento.clienteId,
    proyectoId: evento.proyectoId,
    productoId: evento.productoId,
    moduloCodigo: evento.moduloCodigo,
    prioridadUsu: evento.prioridadUsu,
    prioridadCal: evento.prioridadCal,
    // prioridadFin: evento.prioridadFin,
    fechaInicio: evento.fechaInicio,
    fechaFinEst: evento.fechaFinEst,
    fechaFinReal: evento.fechaFinReal,
    fechaEntrega: evento.fechaEntrega,
    // createdAt: evento.createdAt,
    // updatedAt: evento.updatedAt,
    // deletedAt: evento.deletedAt,
    comentario: evento.comentario,
  };
};

export interface NotionPageResult {
  pageId: string;
  url: string;
  properties?: Record<string, any>;
  title?: string;
}

export type EventoVistaAdjuntosActivo = boolean | 'all';

export interface EventoVistaOpciones {
  incluirActividad?: boolean;
  incluirAdjuntos?: boolean;
  incluirRequisitos?: boolean;
  adjuntosActivo?: EventoVistaAdjuntosActivo;
}

export interface EventoVistaResponse {
  evento: EventoCompleto;
  actividad?: VidaEvento[];
  adjuntos?: any[];
  requisitos?: Evento_requisito_completo[];
  estimacionDetalle?: any;
}

/// datos mock

export const etapas: TipoEventoTimelineEtapa[] = [
  {
    id: 11,
    nombre: 'INGRESO',
    secuencia: 1,
    deAutoriza: false,
    deArchivo: false,
    rolPreferido: 'CONS',
  },
  {
    id: 2,
    nombre: 'AUTORIZAR',
    secuencia: 2,
    deAutoriza: true,
    deArchivo: false,
    rolPreferido: 'MESA',
    rollback: {
      secuencia: -13,
      nombre: 'Rechazados',
    },
  },
  {
    id: 4,
    nombre: 'CONSTRUIR',
    secuencia: 3,
    deAutoriza: false,
    deArchivo: false,
    rolPreferido: 'DESA',
  },
  {
    id: 14,
    nombre: 'TESTEO',
    secuencia: 4,
    deAutoriza: false,
    deArchivo: false,
    rolPreferido: 'CONS',
    rollback: {
      secuencia: 3,
      nombre: 'CONSTRUIR',
    },
  },
  {
    id: 3,
    nombre: 'CONSOLIDAR',
    secuencia: 5,
    deAutoriza: false,
    deArchivo: false,
    rolPreferido: 'DESA',
  },
  {
    id: 12,
    nombre: 'PRESUPUESTAR',
    secuencia: 6,
    deAutoriza: false,
    deArchivo: false,
    rolPreferido: 'ADMIN',
    rollback: {
      secuencia: 3,
      nombre: 'CONSTRUIR',
    },
  },
  {
    id: 5,
    nombre: 'ENVIAR',
    secuencia: 7,
    deAutoriza: false,
    deArchivo: false,
    rolPreferido: 'MESA',
  },
  {
    id: 10,
    nombre: 'Finalizados',
    secuencia: 99,
    deAutoriza: false,
    deArchivo: true,
    rolPreferido: 'ADMIN',
  },
];

export const etapaActualSecuencia = 2;

export const eventoMock: EventoCompleto = {
  id: 'mock-evento-v2',
  tipoCodigo: 'CAS',
  numero: 1,
  titulo: 'PRUEBA CAS con adjunto',
  cerrado: false,
  estado: EstadosEvento.En_Curso,
  etapaActual: 2,
  usuarioAltaId: 'u-1',
  facEventoCerr: false,
  clienteId: 1,
  proyectoId: 1,
  productoId: 1,
  moduloCodigo: 'MOD',
  prioridadUsu: 3,
  prioridadCal: 2,
  prioridadFin: 3,
  fechaInicio: '2026-02-11T00:00:00.000Z',
  fechaFinEst: '2026-02-20T00:00:00.000Z',
  fechaFinReal: undefined,
  fechaEntrega: '2026-02-22T00:00:00.000Z',
  createdAt: '2026-01-02T21:05:00.000Z',
  tipo: {
    codigo: 'CAS',
    descripcion: 'DESARROLLO',
    activo: true,
    color: '#e91e8c',
  },
  cliente: {
    id: 1,
    sigla: 'GACI',
    nombre: 'GACI GROUP',
    activo: true,
    critico: false,
  },
  producto: {
    id: 1,
    sigla: 'G60',
    nombre: 'GACI 6.0 PRODUCTO ESTÁNDAR',
    entornoCodigo: 'WIN',
    activo: true,
    critico: false,
  },
  usuarioAlta: {
    id: 'u-1',
    nombre: 'Julian',
    apellido: 'Torossian',
    usuario: 'Jtorossian',
    color: '#c15dd6',
  },
  usuarioActual: {
    id: 'u-2',
    nombre: 'Florencia',
    apellido: 'Rossi',
    usuario: 'SAIETA',
    color: '#e91e8c',
  },
  modulo: {
    codigo: 'MOD',
    nombre: 'Módulo base',
    padreCodigo: null,
    activo: true,
  },
  proyecto: {
    id: 1,
    sigla: 'PROJ',
    nombre: 'Proyecto Base',
    activo: true,
    critico: false,
  },
  etapaActualData: {
    id: 2,
    nombre: 'AUTORIZAR',
    rolPreferido: 'MESA',
    activo: true,
  },
  etapaSiguiente: {
    id: 4,
    nombre: 'CONSTRUIR',
    rolPreferido: 'DESA',
    activo: true,
  },
  etapaAnterior: {
    id: 11,
    nombre: 'INGRESO',
    rolPreferido: 'CONS',
    activo: true,
  },
  registrosHora: [],
  auditorias: [],
  eventosAdicion: [],
  requisitos: [],
  observadores: [],
  documentacion: [],
};

export const requisitosMock: any[] = [
  {
    cumplido: true,
    requisito: 'Documento funcional validado',
    etapa: 'Autorizar',
    valor: 'Aprobado por lider tecnico',
  },
  {
    cumplido: false,
    requisito: 'Checklist de impacto en cliente',
    etapa: 'Autorizar',
    valor: '',
  },
];

export const documentacionMock: EventoDocumentacion[] = [
  {
    id: 'doc-1',
    eventoId: 'mock-evento-v2',
    proveedor: 'Notion',
    externalId: 'N-123',
    externalUrl: 'https://www.notion.so/',
    titulo: '[CAS-001] - PRUEBA CAS',
    esPrincipal: true,
    createdAt: new Date('2026-02-11T10:00:00'),
    updatedAt: new Date('2026-02-11T10:00:00'),
  },
];

export const adjuntosMock: any[] = [
  {
    id: 101,
    mimeType:
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    archivo: {
      name: 'CUS 8465.docx',
      mimeType:
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      path: '/mock/cus-8465.docx',
    },
    auditorias: [
      {
        fecha: '2026-02-11T10:00:00',
      },
    ],
  },
];

export const actividadesMock: VidaEvento[] = [
  {
    id: 1,
    eventoId: 'mock-evento-v2',
    etapaNumero: 2,
    usuarioId: 'u-1',
    fecha: new Date('2026-02-15T12:00:00'),
    accion: ACCIONES.AVANZO,
    usuario: {
      id: 'u-1',
      nombre: 'Julian',
      apellido: 'Torossian',
      usuario: 'Jtorossian',
      color: '#000000',
    },
  },
  {
    id: 2,
    eventoId: 'mock-evento-v2',
    etapaNumero: 2,
    usuarioId: 'u-2',
    fecha: new Date('2026-02-17T14:30:00'),
    accion: ACCIONES.COMENTARIO,
    usuario: {
      id: 'u-2',
      nombre: 'Florencia',
      apellido: 'Rossi',
      usuario: 'Frossi',
      color: '#000000',
    },
    adicion: {
      id: 11,
      eventoId: 'mock-evento-v2',
      tipo: ACCIONES.COMENTARIO,
      comentario: {
        texto:
          'Por favor revisar los documentos adjuntos antes de proceder a la siguiente etapa.',
      },
      menciones: [],
    },
  },
  {
    id: 3,
    eventoId: 'mock-evento-v2',
    etapaNumero: 2,
    usuarioId: 'u-1',
    fecha: new Date('2026-02-18T09:15:00'),
    accion: ACCIONES.ADJUNTO,
    usuario: {
      id: 'u-1',
      nombre: 'Julian',
      apellido: 'Torossian',
      usuario: 'Jtorossian',
      color: '#000000',
    },
    adicion: {
      id: 12,
      eventoId: 'mock-evento-v2',
      tipo: ACCIONES.ADJUNTO,
      archivo: {
        nameFile: 'CUS 8465.docx',
      },
    },
  },
  {
    id: 4,
    eventoId: 'mock-evento-v2',
    etapaNumero: 2,
    usuarioId: 'u-1',
    fecha: new Date('2026-02-20T10:00:00'),
    accion: ACCIONES.LIBERO_EVENTO,
    usuario: {
      id: 'u-1',
      nombre: 'Julian',
      apellido: 'Torossian',
      usuario: 'Jtorossian',
      color: '#000000',
    },
  },
];
