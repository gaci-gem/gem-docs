
export enum FiltroActivo {
  ALL='all',
  TRUE='true',
  FALSE='false'
}

export const FiltroActivoOptions = [
  { value: FiltroActivo.ALL, label: "Todos", icon: 'lucideAsterisk' },
  { value: FiltroActivo.TRUE, label: "Activos", icon: undefined },
  { value: FiltroActivo.FALSE, label: "Inactivos", icon: undefined }
];

export const FiltroCerradoOptions = [
  { value: FiltroActivo.ALL, label: "Todos", icon: 'lucideAsterisk' },
  { value: FiltroActivo.TRUE, label: "Cerrados", icon: 'lucideLockKeyhole' },
  { value: FiltroActivo.FALSE, label: "Abiertos", icon: 'lucideLockKeyholeOpen' }
];