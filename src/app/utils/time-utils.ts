// Convierte una cadena como '2m', '30s', '1h' en milisegundos
export function parseTimeToMs(time: string): number {
  const match = /^([0-9]+)\s*(s|m|h)$/i.exec(time.trim());
  if (!match) return 0;
  const value = parseInt(match[1], 10);
  const unit = match[2].toLowerCase();
  switch (unit) {
    case 's': return value * 1000;
    case 'm': return value * 60 * 1000;
    case 'h': return value * 60 * 60 * 1000;
    default: return 0;
  }
}

export function getTimestamp(date?: Date): string {
  const now = date || new Date();
  const stamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2,'0')}${String(now.getMinutes()).padStart(2,'0')}${String(now.getSeconds()).padStart(2,'0')}`;
  return stamp;
}
