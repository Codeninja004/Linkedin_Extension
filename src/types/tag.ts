/**
 * Tags are stored globally (a single dictionary of Tag records). Contacts
 * only ever reference tags by id, so renaming/recoloring a tag updates it
 * everywhere at once.
 */
export interface Tag {
  id: string;
  name: string;
  /** Tailwind-friendly hex color used for the chip background. */
  color: string;
}

export const TAG_COLOR_PALETTE = [
  '#4f46e5', // indigo
  '#0ea5e9', // sky
  '#10b981', // emerald
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#14b8a6', // teal
  '#6b7280', // gray
] as const;
