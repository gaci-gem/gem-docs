

export function getPrioridadDesc(prioridad:number) {
  switch (prioridad) {
    case 1:
      return 'Nula';
    case 2:
      return 'Baja';
    case 3:
      return 'Media';
    case 4:
      return 'Alta';
    case 5:
      return 'Crítica';
    default:
      return 'Desconocida';
  }
}