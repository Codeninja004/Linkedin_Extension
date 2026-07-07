import { useCallback, useEffect, useState } from 'react';
import type { Contact, Tag } from '@/types';
import { StorageService } from '@/storage';
import { useAppliedTheme } from '@/hooks/useAppliedTheme';
import { useContactsFilter } from './hooks/useContactsFilter';
import { FiltersBar } from './components/FiltersBar';
import { ContactsTable } from './components/ContactsTable';
import { ExportImportBar } from './components/ExportImportBar';
import { SettingsPanel } from '@/popup/components/SettingsPanel';

export function DashboardApp() {
  useAppliedTheme();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [showSettings, setShowSettings] = useState(false);

  const refresh = useCallback(async () => {
    const [contactList, tagList] = await Promise.all([StorageService.getContacts(), StorageService.getTags()]);
    setContacts(contactList);
    setTags(tagList);
  }, []);

  useEffect(() => {
    refresh();
    const unsubscribe = StorageService.onChange(refresh);
    return unsubscribe;
  }, [refresh]);

  const { filters, setFilters, companies, filtered, sortKey, sortDir, toggleSort } = useContactsFilter(contacts);

  async function handleDelete(id: string) {
    await StorageService.deleteContact(id);
    refresh();
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-8 font-sans">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-neutral-900 dark:text-neutral-50">LinkedIn CRM Dashboard</h1>
          <p className="text-base text-neutral-500 dark:text-neutral-400">
            {contacts.length} contact{contacts.length === 1 ? '' : 's'} tracked locally on this device.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ExportImportBar onImported={refresh} />
          <button type="button" className="lcrm-btn-secondary" onClick={() => setShowSettings((s) => !s)}>
            Settings
          </button>
        </div>
      </header>

      {showSettings && (
        <div className="mb-6 max-w-sm">
          <SettingsPanel onClose={() => setShowSettings(false)} />
        </div>
      )}

      <div className="mb-4">
        <FiltersBar filters={filters} onChange={setFilters} companies={companies} tags={tags} />
      </div>

      <ContactsTable
        contacts={filtered}
        tags={tags}
        sortKey={sortKey}
        sortDir={sortDir}
        onSort={toggleSort}
        onOpenProfile={(url) => chrome.tabs.create({ url })}
        onDelete={handleDelete}
      />
    </div>
  );
}
