import { useMemo, useState } from 'react';
import type { LinkedInProfileData } from '@/types';
import { useContactStore } from '@/store/contactStore';
import { useTagTemplateStore } from '@/store/tagTemplateStore';
import { ContactHeader } from '../components/ContactHeader';
import { PlusIcon, UsersIcon } from '../components/icons';

/**
 * Shown when a profile has been detected but isn't on the list yet. Nothing
 * is written to chrome.storage.local until the user explicitly clicks "Add
 * Profile to List" — this is the one deliberate manual step in an otherwise
 * automatic extension, so a quick look at someone's profile never silently
 * adds them to your CRM.
 *
 * Before adding, the user picks which list (target audience) the contact
 * should go into. Lists are managed on the Dashboard, but a first list can
 * be created inline here so the very first add isn't a dead end.
 */
export function PendingProfilePage({ profile }: { profile: LinkedInProfileData }) {
  const addPendingProfileToList = useContactStore((s) => s.addPendingProfileToList);
  const lists = useTagTemplateStore((s) => s.lists);
  const createList = useTagTemplateStore((s) => s.createList);

  const [isAdding, setIsAdding] = useState(false);
  const [selectedListId, setSelectedListId] = useState<string>('');
  const [isCreating, setIsCreating] = useState(false);
  const [newListName, setNewListName] = useState('');

  const sortedLists = useMemo(
    () => [...lists].sort((a, b) => a.name.localeCompare(b.name)),
    [lists]
  );

  async function handleCreateList() {
    const name = newListName.trim();
    if (!name) return;
    const list = await createList({ name });
    setSelectedListId(list.id);
    setNewListName('');
    setIsCreating(false);
  }

  async function handleAdd() {
    setIsAdding(true);
    try {
      await addPendingProfileToList(selectedListId ? [selectedListId] : []);
    } finally {
      setIsAdding(false);
    }
  }

  return (
    <>
      <ContactHeader profile={profile} />
      <div className="lcrm-card shrink-0 p-4">
        <p className="text-base text-neutral-500 dark:text-neutral-400">
          This profile isn't on your list yet.
        </p>

        <div className="mt-3">
          <label className="mb-1 flex items-center gap-1.5 text-sm font-medium text-neutral-600 dark:text-neutral-300">
            <UsersIcon className="h-4 w-4" />
            Add to list
          </label>

          {isCreating ? (
            <div className="flex gap-1.5">
              <input
                autoFocus
                type="text"
                className="lcrm-input"
                placeholder="New list name…"
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleCreateList();
                  } else if (e.key === 'Escape') {
                    setIsCreating(false);
                    setNewListName('');
                  }
                }}
              />
              <button type="button" className="lcrm-btn-primary shrink-0" onClick={handleCreateList} disabled={!newListName.trim()}>
                Create
              </button>
            </div>
          ) : (
            <div className="flex gap-1.5">
              <select
                className="lcrm-select flex-1"
                value={selectedListId}
                onChange={(e) => setSelectedListId(e.target.value)}
              >
                <option value="">No specific list</option>
                {sortedLists.map((list) => (
                  <option key={list.id} value={list.id}>
                    {list.name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="lcrm-btn-secondary shrink-0"
                onClick={() => setIsCreating(true)}
                title="Create a new list"
              >
                <PlusIcon />
                New
              </button>
            </div>
          )}
        </div>

        <button type="button" className="lcrm-btn-primary mt-3 w-full" onClick={handleAdd} disabled={isAdding}>
          <PlusIcon />
          {isAdding ? 'Adding…' : 'Add Profile to List'}
        </button>
      </div>
    </>
  );
}
