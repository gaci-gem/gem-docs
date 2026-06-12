import { Usuario } from "./usuario";

export interface Rol {
  codigo: string;
  descripcion: string;
  activo?: boolean;
  color?: string;

  usuarios?: Usuario[];
  permisos?: RolPermiso[]; // Array de permisos del rol con estructura completa
}

export interface RolPermiso {
  rolCodigo: string;
  permisoId: number;
  activo?: boolean;
  permiso?: Permiso;
}

export interface Permiso {
  id: number;
  codigo: string;
  subcodigo: string;
  descripcion: string;
  modulo: string;
}

// Estructura de permisos disponibles desde el backend
export interface PermisoDisponible {
  codigo: string;
  modulo: string;
  acciones: PermisoAccion[];
}

export interface PermisoAccion {
  id: number;
  subcodigo: string;
  descripcion: string;
}

// Payload para crear/modificar roles
export interface RolPayload {
  codigo: string;
  descripcion: string;
  color?: string;
  permisos: RolPermisoPayload[];
}

export interface RolPermisoPayload {
  permisoId: number;
  activo: boolean;
}

export interface PermisoConfig {
  clave: string;
  descripcion: string;
  acciones: PermisoAccionConfig[];
}

export interface PermisoAccionConfig {
  accion: 'LEER' | 'CREAR' | 'MODIFICAR' | 'ELIMINAR';
  label: string;
  habilitado: boolean;
}

export enum PermisoClave {
  ADMIN = 'ADM',
  EVENTO = 'EVT',
  EVENTO_TIPO_FAC = 'ETF',
  CLIENTE = 'CLI',
  PROYECTO = 'PRO',
  USUARIO = 'USR',
  MODULO = 'MOD',
  ENTORNO = 'ENT',
  PRODUCTO = 'PRD',
  HORAS_GENERALES = 'HOG',
  EVENTO_DOCUMENTO = 'EVD',
  ETAPA = 'ETA',
  TIPO_EVENTO = 'TEV',
  ROL = 'ROL',
  REPORTE = 'REP',
  SISTEMA = 'SYS',
  KB = 'KB',
  TIPO_TRABAJO = 'TTR',
  NOV = 'NOV'
}

// Array vacío de permisos para inicialización
export const permisosVacios: string[] = [];

export const permisosData: PermisoConfig[] = [
  {
    clave: PermisoClave.EVENTO,
    descripcion: 'Eventos',
    acciones: [
      { accion: 'LEER', label: 'Ver eventos', habilitado: true },
      { accion: 'CREAR', label: 'Crear eventos', habilitado: true },
      { accion: 'MODIFICAR', label: 'Modificar eventos', habilitado: true },
      { accion: 'ELIMINAR', label: 'Eliminar eventos', habilitado: true }
    ]
  },
  {
    clave: PermisoClave.EVENTO_TIPO_FAC,
    descripcion: 'Eventos tipo de facturación',
    acciones: [
      { accion: 'MODIFICAR', label: 'Modificar tipo de facturación', habilitado: true }
    ]
  },
  {
    clave: PermisoClave.EVENTO_DOCUMENTO,
    descripcion: 'Documentos de eventos',
    acciones: [
      { accion: 'ELIMINAR', label: 'Eliminar documentos', habilitado: true }
    ]
  },
  {
    clave: PermisoClave.CLIENTE,
    descripcion: 'Clientes',
    acciones: [
      { accion: 'LEER', label: 'Ver clientes', habilitado: true },
      { accion: 'CREAR', label: 'Crear clientes', habilitado: true },
      { accion: 'MODIFICAR', label: 'Modificar clientes', habilitado: true },
      { accion: 'ELIMINAR', label: 'Eliminar clientes', habilitado: true }
    ]
  },
  {
    clave: PermisoClave.PROYECTO,
    descripcion: 'Proyectos',
    acciones: [
      { accion: 'LEER', label: 'Ver proyectos', habilitado: true },
      { accion: 'CREAR', label: 'Crear proyectos', habilitado: true },
      { accion: 'MODIFICAR', label: 'Modificar proyectos', habilitado: true },
      { accion: 'ELIMINAR', label: 'Eliminar proyectos', habilitado: true }
    ]
  },
  {
    clave: PermisoClave.HORAS_GENERALES,
    descripcion: 'Horas Generales',
    acciones: [
      { accion: 'LEER', label: 'Ver horas generales', habilitado: true }
    ]
  },
  {
    clave: PermisoClave.MODULO,
    descripcion: 'Módulos',
    acciones: [
      { accion: 'LEER', label: 'Ver módulos', habilitado: true },
      { accion: 'CREAR', label: 'Crear módulos', habilitado: true },
      { accion: 'MODIFICAR', label: 'Modificar módulos', habilitado: true },
      { accion: 'ELIMINAR', label: 'Eliminar módulos', habilitado: true }
    ]
  },
  {
    clave: PermisoClave.ENTORNO,
    descripcion: 'Entornos',
    acciones: [
      { accion: 'LEER', label: 'Ver entornos', habilitado: true },
      { accion: 'CREAR', label: 'Crear entornos', habilitado: true },
      { accion: 'MODIFICAR', label: 'Modificar entornos', habilitado: true },
      { accion: 'ELIMINAR', label: 'Eliminar entornos', habilitado: true }
    ]
  },
  {
    clave: PermisoClave.PRODUCTO,
    descripcion: 'Productos',
    acciones: [
      { accion: 'LEER', label: 'Ver productos', habilitado: true },
      { accion: 'CREAR', label: 'Crear productos', habilitado: true },
      { accion: 'MODIFICAR', label: 'Modificar productos', habilitado: true },
      { accion: 'ELIMINAR', label: 'Eliminar productos', habilitado: true }
    ]
  },
  {
    clave: PermisoClave.ETAPA,
    descripcion: 'Etapas',
    acciones: [
      { accion: 'LEER', label: 'Ver etapas', habilitado: true },
      { accion: 'CREAR', label: 'Crear etapas', habilitado: true },
      { accion: 'MODIFICAR', label: 'Modificar etapas', habilitado: true },
      { accion: 'ELIMINAR', label: 'Eliminar etapas', habilitado: true }
    ]
  },
  {
    clave: PermisoClave.TIPO_EVENTO,
    descripcion: 'Tipos de Eventos',
    acciones: [
      { accion: 'LEER', label: 'Ver tipos de eventos', habilitado: true },
      { accion: 'CREAR', label: 'Crear tipos de eventos', habilitado: true },
      { accion: 'MODIFICAR', label: 'Modificar tipos de eventos', habilitado: true },
      { accion: 'ELIMINAR', label: 'Eliminar tipos de eventos', habilitado: true }
    ]
  },
  {
    clave: PermisoClave.ROL,
    descripcion: 'Roles',
    acciones: [
      { accion: 'LEER', label: 'Ver roles', habilitado: true },
      { accion: 'CREAR', label: 'Crear roles', habilitado: true },
      { accion: 'MODIFICAR', label: 'Modificar roles', habilitado: true },
      { accion: 'ELIMINAR', label: 'Eliminar roles', habilitado: true }
    ]
  },
  {
    clave: PermisoClave.USUARIO,
    descripcion: 'Usuarios',
    acciones: [
      { accion: 'LEER', label: 'Ver usuarios', habilitado: true },
      { accion: 'CREAR', label: 'Crear usuarios', habilitado: true },
      { accion: 'MODIFICAR', label: 'Modificar usuarios', habilitado: true },
      { accion: 'ELIMINAR', label: 'Eliminar usuarios', habilitado: true }
    ]
  },
  {
    clave: PermisoClave.REPORTE,
    descripcion: 'Reportes',
    acciones: [
      { accion: 'LEER', label: 'Ver reportes', habilitado: true },
      { accion: 'CREAR', label: 'Crear reportes', habilitado: true },
      { accion: 'MODIFICAR', label: 'Modificar reportes', habilitado: true },
      { accion: 'ELIMINAR', label: 'Eliminar reportes', habilitado: true }
    ]
  },
  {
    clave: PermisoClave.TIPO_TRABAJO,
    descripcion: 'Tipos de Trabajo (Categorías de Horas)',
    acciones: [
      { accion: 'LEER', label: 'Ver tipos de trabajo', habilitado: true },
      { accion: 'CREAR', label: 'Crear tipos de trabajo', habilitado: true },
      { accion: 'MODIFICAR', label: 'Modificar tipos de trabajo', habilitado: true },
      { accion: 'ELIMINAR', label: 'Eliminar tipos de trabajo', habilitado: true }
    ]
  },
  {
    clave: PermisoClave.NOV,
    descripcion: 'Novedades',
    acciones: [
      { accion: 'LEER', label: 'Ver novedades', habilitado: true },
      { accion: 'CREAR', label: 'Crear novedades', habilitado: true },
      { accion: 'ELIMINAR', label: 'Eliminar novedades', habilitado: true }
    ]
  }
];