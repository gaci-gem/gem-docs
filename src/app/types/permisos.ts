// Acciones granulares para RBAC
export enum PermisoAccion {
  LEER = 'LEER',
  CREAR = 'CREAR',
  MODIFICAR = 'MODIFICAR',
  ELIMINAR = 'ELIMINAR',
  REASIGNAR = 'REASIGNAR',
  TPO_FACTURABLE = 'TPO_FACTU',
  DOC_ELIMINAR = 'DOC_ELIMINAR',
  LOG_LEER = 'LOG_LEER',
  REQ_MODIFICAR = 'REQ_MODIFICAR',
}

// Tipo para permisos completos en formato "RECURSO.ACCION"
export type PermisoCompleto = string;