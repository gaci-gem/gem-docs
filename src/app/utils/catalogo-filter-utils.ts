import { HttpParams } from '@angular/common/http';

/**
 * Interfaz para definir un filtro de catálogo
 */
export interface CatalogoFiltro {
  tipo: string;        // Ej: "KB_PLATAFORMA", "PROYECTO_ESTADO"
  valores: string[];   // Valores seleccionados
}

/**
 * Interfaz para la configuración de filtros de catálogo de un módulo
 */
export interface CatalogoFiltroConfig {
  /** Mapeo entre el nombre del parámetro de query y el tipo de catálogo */
  [queryParam: string]: string;
}

/**
 * Configuración de filtros para diferentes módulos
 * 
 * Ejemplo de uso:
 * ```typescript
 * const KB_FILTROS: CatalogoFiltroConfig = {
 *   plataforma: 'KB_PLATAFORMA',
 *   tecnologia: 'KB_TECNOLOGIA',
 *   estado: 'KB_ESTADO'
 * };
 * ```
 */
export const CATALOGO_FILTROS_CONFIG: Record<string, CatalogoFiltroConfig> = {
  KB: {
    plataforma: 'KB_PLATAFORMA',
    tecnologia: 'KB_TECNOLOGIA',
    compilador: 'KB_COMPILADOR',
    tipo: 'KB_TIPO',
    estado: 'KB_ESTADO',
    uso_actual: 'KB_USO_ACTUAL'
  },
  // Agregar otras configuraciones para otros módulos
  PROYECTO: {
    estado: 'PROYECTO_ESTADO',
    tipo: 'PROYECTO_TIPO',
    prioridad: 'PROYECTO_PRIORIDAD'
  },
  EVENTO: {
    estado: 'EVENTO_ESTADO',
    tipo: 'TIPO_EVENTO'
  }
};

/**
 * Construye HttpParams a partir de filtros de catálogo
 * Soporta dos formatos:
 * 1. Formato simple: ?plataforma=GENEXUS,ANGULAR
 * 2. Formato JSON: ?catalogos=[{"tipo":"KB_PLATAFORMA","valores":["GENEXUS"]}]
 * 
 * @param filtros - Objeto con los filtros a aplicar
 * @param config - Configuración de mapeo de filtros (opcional)
 * @param formato - 'simple' o 'json'. Por defecto 'simple'
 * @returns HttpParams con los parámetros de consulta
 * 
 * @example Formato simple
 * ```typescript
 * const filtros = { plataforma: ['GENEXUS', 'ANGULAR'], estado: ['ACTIVA'] };
 * const params = buildCatalogoParams(filtros, CATALOGO_FILTROS_CONFIG.KB);
 * // Resultado: ?plataforma=GENEXUS,ANGULAR&estado=ACTIVA
 * ```
 * 
 * @example Formato JSON
 * ```typescript
 * const filtros = { plataforma: ['GENEXUS'], estado: ['ACTIVA'] };
 * const params = buildCatalogoParams(filtros, CATALOGO_FILTROS_CONFIG.KB, 'json');
 * // Resultado: ?catalogos=[{"tipo":"KB_PLATAFORMA","valores":["GENEXUS"]},{"tipo":"KB_ESTADO","valores":["ACTIVA"]}]
 * ```
 * 
 * @example Sin configuración (formato JSON)
 * ```typescript
 * const filtros = [
 *   { tipo: 'KB_PLATAFORMA', valores: ['GENEXUS'] },
 *   { tipo: 'KB_ESTADO', valores: ['ACTIVA'] }
 * ];
 * const params = buildCatalogoParams(filtros);
 * // Resultado: ?catalogos=[{"tipo":"KB_PLATAFORMA","valores":["GENEXUS"]},{"tipo":"KB_ESTADO","valores":["ACTIVA"]}]
 * ```
 */
export function buildCatalogoParams(
  filtros: Record<string, string[]> | CatalogoFiltro[],
  config?: CatalogoFiltroConfig,
  formato: 'simple' | 'json' = 'simple'
): HttpParams {
  let params = new HttpParams();

  // Si filtros es un array de CatalogoFiltro (formato JSON directo)
  if (Array.isArray(filtros)) {
    const filtrosActivos = filtros.filter(f => f.valores && f.valores.length > 0);
    if (filtrosActivos.length > 0) {
      params = params.set('catalogos', JSON.stringify(filtrosActivos));
    }
    return params;
  }

  // Si filtros es un objeto y no hay configuración, no podemos procesar
  if (!config) {
    console.warn('buildCatalogoParams: Se requiere configuración para procesar filtros en formato objeto');
    return params;
  }

  // Formato simple: cada filtro como parámetro de query
  if (formato === 'simple') {
    Object.entries(filtros).forEach(([key, valores]) => {
      if (valores && valores.length > 0) {
        params = params.set(key, valores.join(','));
      }
    });
    return params;
  }

  // Formato JSON: array de objetos con tipo y valores
  const catalogosFiltros: CatalogoFiltro[] = [];
  
  Object.entries(filtros).forEach(([key, valores]) => {
    if (valores && valores.length > 0) {
      const tipoCatalogo = config[key];
      if (tipoCatalogo) {
        catalogosFiltros.push({
          tipo: tipoCatalogo,
          valores: valores
        });
      }
    }
  });

  if (catalogosFiltros.length > 0) {
    params = params.set('catalogos', JSON.stringify(catalogosFiltros));
  }

  return params;
}

/**
 * Convierte un objeto de filtros simples a un array de CatalogoFiltro
 * 
 * @param filtros - Objeto con los filtros
 * @param config - Configuración de mapeo
 * @returns Array de CatalogoFiltro
 * 
 * @example
 * ```typescript
 * const filtros = { plataforma: ['GENEXUS'], estado: ['ACTIVA'] };
 * const catalogoFiltros = convertToCatalogoFiltros(filtros, CATALOGO_FILTROS_CONFIG.KB);
 * // Resultado: [
 * //   { tipo: 'KB_PLATAFORMA', valores: ['GENEXUS'] },
 * //   { tipo: 'KB_ESTADO', valores: ['ACTIVA'] }
 * // ]
 * ```
 */
export function convertToCatalogoFiltros(
  filtros: Record<string, string[]>,
  config: CatalogoFiltroConfig
): CatalogoFiltro[] {
  return Object.entries(filtros)
    .filter(([_, valores]) => valores && valores.length > 0)
    .map(([key, valores]) => ({
      tipo: config[key],
      valores: valores
    }))
    .filter(f => f.tipo); // Filtrar solo los que tienen tipo definido
}

/**
 * Parsea los query params de catálogo y los convierte a un formato estándar
 * Útil para leer los filtros desde la URL
 * 
 * @param queryParams - Objeto con los query params de la URL
 * @param config - Configuración de mapeo (opcional para formato JSON)
 * @returns Objeto con los filtros parseados
 * 
 * @example Desde formato simple
 * ```typescript
 * const queryParams = { plataforma: 'GENEXUS,ANGULAR', estado: 'ACTIVA' };
 * const filtros = parseCatalogoQueryParams(queryParams, CATALOGO_FILTROS_CONFIG.KB);
 * // Resultado: { plataforma: ['GENEXUS', 'ANGULAR'], estado: ['ACTIVA'] }
 * ```
 * 
 * @example Desde formato JSON
 * ```typescript
 * const queryParams = { catalogos: '[{"tipo":"KB_PLATAFORMA","valores":["GENEXUS"]}]' };
 * const filtros = parseCatalogoQueryParams(queryParams, CATALOGO_FILTROS_CONFIG.KB);
 * // Resultado: { plataforma: ['GENEXUS'] }
 * ```
 */
export function parseCatalogoQueryParams(
  queryParams: Record<string, string>,
  config?: CatalogoFiltroConfig
): Record<string, string[]> {
  const filtros: Record<string, string[]> = {};

  // Si hay parámetro 'catalogos' (formato JSON)
  if (queryParams['catalogos']) {
    try {
      const catalogos: CatalogoFiltro[] = JSON.parse(queryParams['catalogos']);
      
      // Si tenemos config, convertir tipos a nombres de parámetros
      if (config) {
        const tipoToParam = Object.entries(config).reduce((acc, [param, tipo]) => {
          acc[tipo] = param;
          return acc;
        }, {} as Record<string, string>);

        catalogos.forEach(c => {
          const paramName = tipoToParam[c.tipo];
          if (paramName) {
            filtros[paramName] = c.valores;
          }
        });
      } else {
        // Sin config, usar el tipo como key
        catalogos.forEach(c => {
          filtros[c.tipo] = c.valores;
        });
      }
    } catch (error) {
      console.error('Error al parsear catalogos JSON:', error);
    }
  } else {
    // Formato simple: cada parámetro es un filtro
    Object.entries(queryParams).forEach(([key, value]) => {
      if (value && (!config || config[key])) {
        filtros[key] = value.split(',').map(v => v.trim());
      }
    });
  }

  return filtros;
}

/**
 * Combina los filtros de catálogo con otros parámetros de consulta
 * 
 * @param baseParams - Parámetros base (ej: activo, búsqueda, paginación)
 * @param filtros - Filtros de catálogo
 * @param config - Configuración de mapeo
 * @param formato - Formato de los filtros
 * @returns HttpParams combinados
 * 
 * @example
 * ```typescript
 * const baseParams = { activo: 'true', search: 'test' };
 * const filtros = { plataforma: ['GENEXUS'] };
 * const params = combineCatalogoParams(baseParams, filtros, CATALOGO_FILTROS_CONFIG.KB);
 * // Resultado: ?activo=true&search=test&plataforma=GENEXUS
 * ```
 */
export function combineCatalogoParams(
  baseParams: Record<string, string | number | boolean>,
  filtros: Record<string, string[]> | CatalogoFiltro[],
  config?: CatalogoFiltroConfig,
  formato: 'simple' | 'json' = 'simple'
): HttpParams {
  let params = new HttpParams();

  // Agregar parámetros base
  Object.entries(baseParams).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params = params.set(key, value.toString());
    }
  });

  // Agregar filtros de catálogo
  const catalogoParams = buildCatalogoParams(filtros, config, formato);
  catalogoParams.keys().forEach(key => {
    const value = catalogoParams.get(key);
    if (value) {
      params = params.set(key, value);
    }
  });

  return params;
}
