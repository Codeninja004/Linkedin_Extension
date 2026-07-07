import { useState, type ReactNode } from 'react';
import { ChevronDownIcon } from './icons';
import { cn } from '@/utils/classnames';

interface CollapsibleSectionProps {
  title: string;
  icon: ReactNode;
  defaultOpen?: boolean;
  badge?: ReactNode;
  children: ReactNode;
}

export function CollapsibleSection({
  title,
  icon,
  defaultOpen = true,
  badge,
  children,
}: CollapsibleSectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="lcrm-card shrink-0 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-2 rounded-t-xl px-4 py-3 text-left transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-800/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-500/50"
      >
        <span className="flex items-center gap-2 text-base font-semibold text-neutral-800 dark:text-neutral-100">
          <span className="text-brand-600 dark:text-brand-400">{icon}</span>
          {title}
          {badge}
        </span>
        <ChevronDownIcon
          className={cn('text-neutral-400 transition-transform', open && 'rotate-180')}
        />
      </button>
      {open && <div className="px-4 pb-4 pt-0 animate-fade-in">{children}</div>}
    </div>
  );
}
