import { useMemo, useState } from 'react';
import type { Contact } from '@/types';
import { ContactRow } from './ContactRow';
import { openProfileTab } from '../openProfile';
import { SearchIcon } from '@/sidebar/components/icons';

export function QuickSearch({ contacts }: { contacts: Contact[] }) {
  const [query, setQuery] = useState('');

  const results = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return [];
    return contacts
      .filter(
        (c) =>
          c.name.toLowerCase().includes(normalized) ||
          c.company.toLowerCase().includes(normalized) ||
          c.headline.toLowerCase().includes(normalized)
      )
      .slice(0, 8);
  }, [contacts, query]);

  return (
    <section>
      <div className="relative px-2">
        <SearchIcon className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" />
        <input
          type="text"
          className="lcrm-input pl-8"
          placeholder="Search contacts by name, company…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
      {query.trim() && (
        <div className="mt-1 space-y-0.5 animate-fade-in">
          {results.length === 0 ? (
            <p className="px-2 text-sm text-neutral-400">No matches.</p>
          ) : (
            results.map((contact) => (
              <ContactRow key={contact.id} contact={contact} onClick={() => openProfileTab(contact.linkedinUrl)} />
            ))
          )}
        </div>
      )}
    </section>
  );
}
