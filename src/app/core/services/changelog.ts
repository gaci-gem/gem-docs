export interface ChangelogEntry {
  version: string;
  date: string;
  changes: string[];
}

export const CHANGELOG: ChangelogEntry[] = [
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
