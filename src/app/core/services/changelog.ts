export interface ChangelogEntry {
  version: string;
  date: string;
  changes: string[];
}

export const CHANGELOG: ChangelogEntry[] = [
  {
    version: '0.2.1',
    date: '2026-10-23',
    changes: [
      'Corregimos el popup automático de Novedades para ignorar cambios de versión patch y mostrarlo solo ante cambios minor o major.',
    ],
  },
  {
    version: '0.2.0',
    date: '2026-09-30',
    changes: [
      'Incorporamos un editor Milkdown con barra de herramientas para trabajar con documentos con mayor comodidad.',
      'Ahora podés administrar las propiedades de los documentos y revisar sugerencias de edición.',
      'Mejoramos la navegación de la bóveda para encontrar y organizar documentos con mayor facilidad.',
      'Sumamos soporte para Markdown y frontmatter, junto con opciones de importación y exportación.',
      'Agregamos mejoras en las pruebas E2E y en la cobertura de testing para una experiencia más confiable.',
    ],
  },
  {
    version: '0.1.0',
    date: '2026-09-20',
    changes: [
      'Ahora es más fácil crear referencias y menciones entre documentos y eventos.',
      'El estado de guardado es más claro y el guardado automático es más confiable, incluso cuando necesita reintentar.',
      'Mejoramos la edición y la navegación para trabajar con tus documentos con mayor comodidad.',
    ],
  },
  {
    version: '0.0.1',
    date: '2026-08-19',
    changes: [
      'Mejoramos la edición y la recarga de documentos.',
      'Hicimos más confiable el trabajo con imágenes y archivos.',
      'Sumamos mejoras generales de uso y estabilidad.',
    ],
  },
];
