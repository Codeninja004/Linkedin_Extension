import { useMemo, useState } from 'react';
import type { Contact } from '@/types';
import { CollapsibleSection } from './CollapsibleSection';
import { Chip } from './Chip';
import { UsersIcon } from './icons';
import { useContactStore } from '@/store/contactStore';
import { useTagTemplateStore } from '@/store/tagTemplateStore';

/**
 * Manages which lists (target audiences) a contact belongs to. Mirrors
 * TagsSection, but drives the `listIds` many-to-many relationship: you can
 * add the contact to any number of lists, and type a new name to create a
 * list on the fly.
 */
export function ListsSection({ contact }: { contact: Contact }) {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const lists = useTagTemplateStore((s) => s.lists);
  const getOrCreateList = useTagTemplateStore((s) => s.getOrCreateList);
  const addToList = useContactStore((s) => s.addToList);
  const removeFromList = useContactStore((s) => s.removeFromList);

  const contactListIds = contact.listIds ?? [];

  const contactLists = useMemo(
    () => contactListIds.map((id) => lists.find((l) => l.id === id)).filter(Boolean) as typeof lists,
    [contactListIds, lists]
  );

  const suggestions = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return lists
      .filter((l) => !contactListIds.includes(l.id))
      .filter((l) => !normalized || l.name.toLowerCase().includes(normalized))
      .slice(0, 6);
  }, [lists, query, contactListIds]);

  async function commitList(name: string) {
    const trimmed = name.trim();
    if (!trimmed) return;
    const list = await getOrCreateList(trimmed);
    await addToList(contact.id, list.id, list.name);
    setQuery('');
  }

  return (
    <CollapsibleSection
      title="Lists"
      icon={<UsersIcon />}
      badge={
        contactLists.length > 0 && (
          <span className="rounded-full bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.5 text-xs font-medium text-neutral-500">
            {contactLists.length}
          </span>
        )
      }
    >
      <div className="flex flex-wrap gap-1.5">
        {contactLists.map((list) => (
          <Chip
            key={list.id}
            label={list.name}
            color={list.color}
            onRemove={() => removeFromList(contact.id, list.id, list.name)}
          />
        ))}
        {contactLists.length === 0 && (
          <p className="text-sm text-neutral-400 dark:text-neutral-500">Not in any list yet.</p>
        )}
      </div>

      <div className="relative mt-3">
        <input
          type="text"
          className="lcrm-input"
          placeholder="Add to or create a list…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setTimeout(() => setIsFocused(false), 120)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              commitList(query);
            }
          }}
        />

        {isFocused && (query.trim() || suggestions.length > 0) && (
          <div className="lcrm-scrollbar absolute z-10 mt-1 max-h-40 w-full overflow-y-auto rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 shadow-panel animate-fade-in">
            {suggestions.map((list) => (
              <button
                key={list.id}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => commitList(list.name)}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-neutral-50 focus-visible:bg-neutral-50 focus-visible:outline-none dark:hover:bg-neutral-700 dark:focus-visible:bg-neutral-700"
              >
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: list.color }} />
                {list.name}
              </button>
            ))}
            {query.trim() && !lists.some((l) => l.name.toLowerCase() === query.trim().toLowerCase()) && (
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => commitList(query)}
                className="flex w-full items-center gap-2 border-t border-neutral-100 px-3 py-2 text-left text-sm text-brand-600 hover:bg-neutral-50 focus-visible:bg-neutral-50 focus-visible:outline-none dark:border-neutral-700 dark:text-brand-400 dark:hover:bg-neutral-700 dark:focus-visible:bg-neutral-700"
              >
                Create list “{query.trim()}”
              </button>
            )}
          </div>
        )}
      </div>
    </CollapsibleSection>
  );
}
