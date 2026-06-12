export const SHORTCUTS = {
  NUEVO: {
    combo: 'Alt+A',
    descripcion: 'Crear nuevo registro'
  },
  INFO: {
    combo: 'Alt+I',
    descripcion: 'Ver atajos de teclado'
  },
} as const;

// 🔑 Claves válidas del objeto (NUEVO, GUARDAR, etc.)
export type ShortcutKey = keyof typeof SHORTCUTS;

// 📦 Tipo de cada definición individual ({ combo, descripcion })
export type ShortcutItem = typeof SHORTCUTS[ShortcutKey];

// 📚 Tipo de todo el objeto SHORTCUTS
export type ShortcutDefinitions = typeof SHORTCUTS;