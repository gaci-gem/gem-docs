export interface ChangelogEntry {
  version: string;
  date: string;
  changes: string[];
}

export const CHANGELOG: ChangelogEntry[] = [
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
