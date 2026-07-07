import type { ReactNode } from 'react';

export function FieldLabel({ children }: { children: ReactNode }) {
  return (
    <label className="mb-1 block text-sm font-medium text-neutral-500 dark:text-neutral-400">
      {children}
    </label>
  );
}
