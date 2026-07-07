import type { ReactNode } from 'react';
import type { Contact } from '@/types';

interface ContactRowProps {
  contact: Contact;
  subtitle?: string;
  actions?: ReactNode;
  onClick?: () => void;
}

export function ContactRow({ contact, subtitle, actions, onClick }: ContactRowProps) {
  const initials = contact.name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');

  return (
    <div className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
      <button
        type="button"
        onClick={onClick}
        className="flex min-w-0 flex-1 items-center gap-2.5 rounded-md text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/50"
      >
        {contact.photo ? (
          <img src={contact.photo} alt="" className="h-9 w-9 shrink-0 rounded-full object-cover" />
        ) : (
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-100 dark:bg-brand-900 text-brand-700 dark:text-brand-300 text-xs font-semibold">
            {initials || '?'}
          </div>
        )}
        <div className="min-w-0">
          <p className="truncate text-base font-medium text-neutral-800 dark:text-neutral-100">
            {contact.name || 'Unknown'}
          </p>
          <p className="truncate text-sm text-neutral-400 dark:text-neutral-500">
            {subtitle ?? contact.company ?? contact.headline}
          </p>
        </div>
      </button>
      {actions && <div className="flex shrink-0 items-center gap-1">{actions}</div>}
    </div>
  );
}
