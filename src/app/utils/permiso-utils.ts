import { PermisoClave } from '@core/interfaces/rol';
import { PermisoAccion } from '@/app/types/permisos';

/**
 * Construye un permiso completo en formato "RECURSO.ACCION"
 * @param clave Clave del recurso (ej: PermisoClave.EVENTO)
 * @param accion Acción a realizar (ej: 'LEER')
 * @returns Permiso en formato "RECURSO.ACCION" (ej: "EVT.LEER")
 */
export function buildPermiso(clave: PermisoClave | string, accion: PermisoAccion): string {
  return `${clave}.${accion}`;
}
