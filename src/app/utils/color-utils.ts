export function getColor(v: string, a: number = 1): string {
  const val = getComputedStyle(document.documentElement)
    .getPropertyValue(`--ins-${v}`)
    .trim()

  return v.includes('-rgb') ? `rgba(${val}, ${a})` : val
}

export function getRandomColor(): string {
  const hex = Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, '0');
  return `#${hex.toUpperCase()}`;
}

export function getContrastYIQ(hexcolor: string): string {
  let hex = (hexcolor || '').replace('#', '');
  if (hex.length === 3) {
    hex = hex.split('').map(x => x + x).join('');
  }
  if (hex.length !== 6) return '#fff';
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
  return yiq >= 128 ? '#222' : '#fff';
}