import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Contact, ContactList, Tag } from '@/types';
import { StorageService } from '@/storage';
import { useAppliedTheme } from '@/hooks/useAppliedTheme';
import { useContactStore } from '@/store/contactStore';
import { useTagTemplateStore } from '@/store/tagTemplateStore';
import { useContactsFilter, UNCATEGORIZED } from './hooks/useContactsFilter';
import { FiltersBar } from './components/FiltersBar';
import { ContactsTable } from './components/ContactsTable';
import { AppSidebar } from './components/AppSidebar';
import { LeadDetailsDrawer } from './components/LeadDetailsDrawer';
import { NotificationsPanel } from './components/NotificationsPanel';
import { ExportImportBar } from './components/ExportImportBar';
import { SettingsPanel } from '@/popup/components/SettingsPanel';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';

export function DashboardApp() {
  useAppliedTheme();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [lists, setLists] = useState<ContactList[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const openContact = useContactStore((s) => s.openContact);
  const activeContactId = useContactStore((s) => s.activeContactId);
  const clearActiveContact = useContactStore((s) => s.clearActiveContact);
  const loadTags = useTagTemplateStore((s) => s.loadTags);
  const loadLists = useTagTemplateStore((s) => s.loadLists);
  const loadTemplates = useTagTemplateStore((s) => s.loadTemplates);

  // The lead-details drawer reuses the sidebar's section components, which read
  // tags/lists/templates from tagTemplateStore — load them once for the page.
  useEffect(() => {
    loadTags();
    loadLists();
    loadTemplates();
  }, [loadTags, loadLists, loadTemplates]);

  const refresh = useCallback(async () => {
    const [contactList, listList, tagList] = await Promise.all([
      StorageService.getContacts(),
      StorageService.getLists(),
      StorageService.getTags(),
    ]);
    setContacts(contactList);
    setLists(listList);
    setTags(tagList);
  }, []);

  useEffect(() => {
    refresh();
    const unsubscribe = StorageService.onChange(refresh);
    return unsubscribe;
  }, [refresh]);

  const { filters, setFilters, companies, filtered, sortKey, sortDir, toggleSort } = useContactsFilter(contacts);

  // If the selected list gets deleted elsewhere, fall back to "All Contacts".
  useEffect(() => {
    if (
      filters.listId !== 'all' &&
      filters.listId !== UNCATEGORIZED &&
      !lists.some((l) => l.id === filters.listId)
    ) {
      setFilters({ ...filters, listId: 'all' });
    }
  }, [lists, filters, setFilters]);

  const selectedList = lists.find((l) => l.id === filters.listId) ?? null;
  const heading = useMemo(() => {
    if (filters.listId === 'all') return 'All Contacts';
    if (filters.listId === UNCATEGORIZED) return 'Uncategorized';
    return selectedList?.name ?? 'All Contacts';
  }, [filters.listId, selectedList]);

  // Close the Settings popup on Escape.
  useEffect(() => {
    if (!showSettings) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowSettings(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [showSettings]);

  async function handleDelete(id: string) {
    await StorageService.deleteContact(id);
    if (activeContactId === id) clearActiveContact();
    refresh();
  }

  function handleOpenLead(contact: Contact) {
    setShowNotifications(false);
    openContact(contact);
  }

  return (
    <SidebarProvider className="font-geist bg-neutral-50 dark:bg-neutral-950">
      <AppSidebar
        lists={lists}
        contacts={contacts}
        selectedListId={filters.listId}
        onSelect={(listId) => setFilters({ ...filters, listId })}
        onChanged={refresh}
        onOpenSettings={() => setShowSettings((s) => !s)}
        onOpenNotifications={() => setShowNotifications((s) => !s)}
      />

      <SidebarInset>
        <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center gap-3 border-b border-neutral-200 bg-neutral-50/85 px-4 backdrop-blur dark:border-neutral-800 dark:bg-neutral-950/85">
          <SidebarTrigger />
          <div className="h-5 w-px bg-neutral-200 dark:bg-neutral-800" />
          <h1 className="flex items-center gap-2 text-base font-semibold text-neutral-900 dark:text-neutral-50">
            {selectedList && (
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: selectedList.color }} />
            )}
            {heading}
            <span className="text-sm font-normal text-neutral-400">({filtered.length})</span>
          </h1>
          <div className="ml-auto">
            <ExportImportBar onImported={refresh} />
          </div>
        </header>

        <div className="flex-1 p-4 md:p-6">
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
            onView={handleOpenLead}
            onDelete={handleDelete}
          />
        </div>
      </SidebarInset>

      <LeadDetailsDrawer />

      {showNotifications && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 pt-[8vh] backdrop-blur-sm animate-fade-in"
          role="dialog"
          aria-modal="true"
          aria-label="Notifications"
          onClick={() => setShowNotifications(false)}
        >
          <div className="w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <NotificationsPanel
              contacts={contacts}
              onOpenLead={handleOpenLead}
              onChanged={refresh}
              onClose={() => setShowNotifications(false)}
            />
          </div>
        </div>
      )}

      {showSettings && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 pt-[10vh] backdrop-blur-sm animate-fade-in"
          role="dialog"
          aria-modal="true"
          aria-label="Settings"
          onClick={() => setShowSettings(false)}
        >
          <div className="w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <SettingsPanel onClose={() => setShowSettings(false)} />
          </div>
        </div>
      )}
    </SidebarProvider>
  );
}
