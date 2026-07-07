export type ClassValue = string | number | null | undefined | false | Record<string, boolean>;

/** Minimal `clsx`-style class name joiner — avoids pulling in a dependency. */
export function cn(...values: ClassValue[]): string {
  const classes: string[] = [];
  for (const value of values) {
    if (!value) continue;
    if (typeof value === 'string' || typeof value === 'number') {
      classes.push(String(value));
    } else {
      for (const [key, enabled] of Object.entries(value)) {
        if (enabled) classes.push(key);
      }
    }
  }
  return classes.join(' ');
}
