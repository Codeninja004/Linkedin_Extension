/** Picks readable black/white text for a given hex background color. */
export function readableTextColor(hex: string): string {
  const clean = hex.replace('#', '');
  if (clean.length !== 6) return '#111827';

  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);

  // Perceived luminance (WCAG-ish approximation).
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? '#111827' : '#ffffff';
}

/** Blends a hex color toward white — used for chip backgrounds so text stays legible. */
export function tint(hex: string, amount: number): string {
  const clean = hex.replace('#', '');
  if (clean.length !== 6) return hex;

  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);

  const blend = (channel: number) => Math.round(channel + (255 - channel) * amount);

  const toHex = (n: number) => n.toString(16).padStart(2, '0');

  return `#${toHex(blend(r))}${toHex(blend(g))}${toHex(blend(b))}`;
}
