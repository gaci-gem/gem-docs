/**
 * Configuración de campos de catálogo para módulos
 */

/**
 * Enum de tipos de catálogo disponibles
 */
export enum TipoCatalogo {
  // KB
  KB_PLATAFORMA = 'KB_PLATAFORMA',
  KB_TECNOLOGIA = 'KB_TECNOLOGIA',
  KB_COMPILADOR = 'KB_COMPILADOR',
  KB_TIPO = 'KB_TIPO',
  KB_ESTADO = 'KB_ESTADO',
  KB_USO = 'KB_USO',
  
  // KB Deploy
  DEPLOY_HOSTING = 'DEPLOY_HOSTING',
  DEPLOY_AMBIENTE = 'DEPLOY_AMBIENTE',
}

export interface CatalogoFieldConfig {
  field: string;
  tipoCatalogo: string;
  descripcion: string;
}

export interface ModuloCatalogoConfig {
  moduleName: string;
  entityName: string;
  fields: CatalogoFieldConfig[];
}

/**
 * Configuración de catálogos para KB
 */
export const KB_CATALOGO_CONFIG: ModuloCatalogoConfig = {
  moduleName: 'kb',
  entityName: 'kb',
  fields: [
    {
      field: 'plataforma',
      tipoCatalogo: 'KB_PLATAFORMA',
      descripcion: 'Plataforma tecnológica (GENEXUS, ANGULAR, REACT, etc.)',
    },
    {
      field: 'tecnologia',
      tipoCatalogo: 'KB_TECNOLOGIA',
      descripcion: 'Tipo de aplicación (WEB, DESKTOP, API, MOBILE)',
    },
    {
      field: 'compilador',
      tipoCatalogo: 'KB_COMPILADOR',
      descripcion: 'Compilador o runtime (DOTNET, JAVA, NODE, etc.)',
    },
    {
      field: 'tipo',
      tipoCatalogo: 'KB_TIPO',
      descripcion: 'Tipo de KB (PRODUCTIVA, TEST, LAB)',
    },
    {
      field: 'estado',
      tipoCatalogo: 'KB_ESTADO',
      descripcion: 'Estado de la KB (ACTIVA, MIGRADA, ARCHIVADA)',
    },
    {
      field: 'uso_actual',
      tipoCatalogo: 'KB_USO',
      descripcion: 'Uso actual (EN_USO, LEGACY, MIGRADA)',
    },
  ],
};

/**
 * Configuración de catálogos para KB_DEPLOY
 */
export const KB_DEPLOY_CATALOGO_CONFIG: ModuloCatalogoConfig = {
  moduleName: 'kb',
  entityName: 'kb_deploy',
  fields: [
    {
      field: 'hosting',
      tipoCatalogo: 'DEPLOY_HOSTING',
      descripcion: 'Hosting del deploy (GACI, CLIENTE, AWS, AZURE)',
    },
    {
      field: 'ambiente',
      tipoCatalogo: 'DEPLOY_AMBIENTE',
      descripcion: 'Ambiente de deploy (PROD, QA, DEV)',
    },
  ],
};

/**
 * Helper para obtener el tipo de catálogo de un campo específico
 */
export function getTipoCatalogoForField(config: ModuloCatalogoConfig, fieldName: string): string | undefined {
  const fieldConfig = config.fields.find(f => f.field === fieldName);
  return fieldConfig?.tipoCatalogo;
}

/**
 * Helper para obtener todas las configuraciones de campos de un módulo
 */
export function getFieldsConfig(config: ModuloCatalogoConfig): CatalogoFieldConfig[] {
  return config.fields;
}

/**
 * Helper para construir un mapa de field -> tipoCatalogo
 */
export function buildFieldToCatalogoMap(config: ModuloCatalogoConfig): Map<string, string> {
  const map = new Map<string, string>();
  config.fields.forEach(f => map.set(f.field, f.tipoCatalogo));
  return map;
}

/**
 * Todas las configuraciones de catálogos
 */
export const ALL_CATALOGO_CONFIGS: ModuloCatalogoConfig[] = [
  KB_CATALOGO_CONFIG,
  KB_DEPLOY_CATALOGO_CONFIG,
];

/**
 * Helper para obtener la descripción de un catálogo por su tipo
 */
export function getDescripcionByTipoCatalogo(tipoCatalogo: string): string | undefined {
  for (const config of ALL_CATALOGO_CONFIGS) {
    const field = config.fields.find(f => f.tipoCatalogo === tipoCatalogo);
    if (field) {
      return field.descripcion;
    }
  }
  return undefined;
}
