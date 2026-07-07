import { useMemo, useState } from 'react';
import type { Contact } from '@/types';
import { CollapsibleSection } from './CollapsibleSection';
import { Chip } from './Chip';
import { TagIcon } from './icons';
import { useContactStore } from '@/store/contactStore';
import { useTagTemplateStore } from '@/store/tagTemplateStore';

export function TagsSection({ contact }: { contact: Contact }) {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const tags = useTagTemplateStore((s) => s.tags);
  const getOrCreateTag = useTagTemplateStore((s) => s.getOrCreateTag);
  const addTag = useContactStore((s) => s.addTag);
  const removeTag = useContactStore((s) => s.removeTag);

  const contactTags = useMemo(
    () => contact.tagIds.map((id) => tags.find((t) => t.id === id)).filter(Boolean) as typeof tags,
    [contact.tagIds, tags]
  );

  const suggestions = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return tags
      .filter((t) => !contact.tagIds.includes(t.id))
      .filter((t) => !normalized || t.name.toLowerCase().includes(normalized))
      .slice(0, 6);
  }, [tags, query, contact.tagIds]);

  async function commitTag(name: string) {
    const trimmed = name.trim();
    if (!trimmed) return;
    const tag = await getOrCreateTag(trimmed);
    await addTag(contact.id, tag.id, tag.name);
    setQuery('');
  }

  return (
    <CollapsibleSection title="Tags" icon={<TagIcon />} badge={contactTags.length > 0 && (
      <span className="rounded-full bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.5 text-xs font-medium text-neutral-500">
        {contactTags.length}
      </span>
    )}>
      <div className="flex flex-wrap gap-1.5">
        {contactTags.map((tag) => (
          <Chip
            key={tag.id}
            label={tag.name}
            color={tag.color}
            onRemove={() => removeTag(contact.id, tag.id, tag.name)}
          />
        ))}
        {contactTags.length === 0 && (
          <p className="text-sm text-neutral-400 dark:text-neutral-500">No tags yet.</p>
        )}
      </div>

      <div className="relative mt-3">
        <input
          type="text"
          className="lcrm-input"
          placeholder="Add or search tags…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setTimeout(() => setIsFocused(false), 120)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              commitTag(query);
            }
          }}
        />

        {isFocused && (query.trim() || suggestions.length > 0) && (
          <div className="lcrm-scrollbar absolute z-10 mt-1 max-h-40 w-full overflow-y-auto rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 shadow-panel animate-fade-in">
            {suggestions.map((tag) => (
              <button
                key={tag.id}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => commitTag(tag.name)}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-neutral-50 focus-visible:bg-neutral-50 focus-visible:outline-none dark:hover:bg-neutral-700 dark:focus-visible:bg-neutral-700"
              >
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: tag.color }} />
                {tag.name}
              </button>
            ))}
            {query.trim() && !tags.some((t) => t.name.toLowerCase() === query.trim().toLowerCase()) && (
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => commitTag(query)}
                className="flex w-full items-center gap-2 border-t border-neutral-100 px-3 py-2 text-left text-sm text-brand-600 hover:bg-neutral-50 focus-visible:bg-neutral-50 focus-visible:outline-none dark:border-neutral-700 dark:text-brand-400 dark:hover:bg-neutral-700 dark:focus-visible:bg-neutral-700"
              >
                Create tag “{query.trim()}”
              </button>
            )}
          </div>
        )}
      </div>
    </CollapsibleSection>
  );
}
