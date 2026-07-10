import { useMemo, useState } from 'react';
import type { Contact, ContactList } from '@/types';
import { LIST_COLOR_PALETTE } from '@/types/list';
import { createList, updateList, deleteList } from '@/services/listService';
import { filterOverdueReminders, filterTodayReminders } from '@/services/reminderService';
import { UNCATEGORIZED } from '../hooks/useContactsFilter';
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuBadge,
  SidebarRail,
} from '@/components/ui/sidebar';
import { PlusIcon, UsersIcon, PencilIcon, TrashIcon, CheckIcon, XIcon, SettingsIcon, BellIcon } from '@/sidebar/components/icons';

interface AppSidebarProps {
  lists: ContactList[];
  contacts: Contact[];
  selectedListId: string;
  onSelect: (listId: string) => void;
  onChanged: () => void;
  onOpenSettings: () => void;
  onOpenNotifications: () => void;
}

export function AppSidebar({
  lists,
  contacts,
  selectedListId,
  onSelect,
  onChanged,
  onOpenSettings,
  onOpenNotifications,
}: AppSidebarProps) {
  const dueCount = useMemo(
    () => filterOverdueReminders(contacts).length + filterTodayReminders(contacts).length,
    [contacts]
  );
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const sortedLists = useMemo(() => [...lists].sort((a, b) => a.name.localeCompare(b.name)), [lists]);

  const counts = useMemo(() => {
    const map = new Map<string, number>();
    let uncategorized = 0;
    for (const c of contacts) {
      const ids = c.listIds ?? [];
      if (ids.length === 0) uncategorized += 1;
      for (const id of ids) map.set(id, (map.get(id) ?? 0) + 1);
    }
    return { map, uncategorized };
  }, [contacts]);

  async function handleCreate() {
    const name = newName.trim();
    if (!name) return;
    const list = await createList({ name });
    setNewName('');
    setIsCreating(false);
    onChanged();
    onSelect(list.id);
  }

  async function handleRename(id: string) {
    const name = editName.trim();
    if (name) await updateList(id, { name });
    setEditingId(null);
    onChanged();
  }

  async function handleDelete(list: ContactList) {
    if (!confirm(`Delete the list "${list.name}"? Contacts stay, but they'll be removed from this list.`)) return;
    await deleteList(list.id);
    if (selectedListId === list.id) onSelect('all');
    onChanged();
  }

  async function cycleColor(list: ContactList) {
    const idx = LIST_COLOR_PALETTE.indexOf(list.color as (typeof LIST_COLOR_PALETTE)[number]);
    await updateList(list.id, { color: LIST_COLOR_PALETTE[(idx + 1) % LIST_COLOR_PALETTE.length] });
    onChanged();
  }

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center gap-2 px-1 py-1.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-brand-600 text-sm font-bold text-white dark:bg-brand-400 dark:text-neutral-950">
            in
          </div>
          <div className="flex flex-col group-data-[collapsible=icon]:hidden">
            <span className="text-sm font-semibold leading-tight text-sidebar-foreground">LinkedIn CRM</span>
            <span className="text-xs text-sidebar-foreground/60">Local contacts</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Lists</SidebarGroupLabel>
          <SidebarGroupAction title="Create a new list" onClick={() => setIsCreating((v) => !v)}>
            <PlusIcon className="h-4 w-4" />
            <span className="sr-only">Create a new list</span>
          </SidebarGroupAction>

          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton isActive={selectedListId === 'all'} onClick={() => onSelect('all')} title="All Contacts">
                  <UsersIcon className="text-neutral-400" />
                  <span>All Contacts</span>
                </SidebarMenuButton>
                <SidebarMenuBadge>{contacts.length}</SidebarMenuBadge>
              </SidebarMenuItem>

              {sortedLists.map((list) =>
                editingId === list.id ? (
                  <SidebarMenuItem key={list.id}>
                    <div className="flex items-center gap-1 px-1 py-0.5">
                      <span className="h-3.5 w-3.5 shrink-0 rounded-full" style={{ backgroundColor: list.color }} />
                      <input
                        autoFocus
                        className="lcrm-input !h-7 !py-1 !text-sm"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleRename(list.id);
                          else if (e.key === 'Escape') setEditingId(null);
                        }}
                      />
                      <button
                        type="button"
                        className="rounded p-1 text-success hover:bg-sidebar-accent dark:text-success-dark"
                        onClick={() => handleRename(list.id)}
                        aria-label="Save list name"
                      >
                        <CheckIcon className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        className="rounded p-1 text-sidebar-foreground/70 hover:bg-sidebar-accent"
                        onClick={() => setEditingId(null)}
                        aria-label="Cancel"
                      >
                        <XIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </SidebarMenuItem>
                ) : (
                  <SidebarMenuItem key={list.id}>
                    <SidebarMenuButton isActive={selectedListId === list.id} onClick={() => onSelect(list.id)} title={list.name}>
                      <span className="flex h-4 w-4 shrink-0 items-center justify-center">
                        <span className="h-3 w-3 rounded-full" style={{ backgroundColor: list.color }} />
                      </span>
                      <span>{list.name}</span>
                    </SidebarMenuButton>

                    <SidebarMenuBadge className="group-hover/menu-item:hidden">
                      {counts.map.get(list.id) ?? 0}
                    </SidebarMenuBadge>

                    <div className="absolute right-1 top-1.5 hidden items-center gap-0.5 group-hover/menu-item:flex group-data-[collapsible=icon]:!hidden">
                      <button
                        type="button"
                        className="rounded p-1 text-sidebar-foreground/70 hover:text-brand-600 dark:hover:text-brand-400"
                        onClick={() => cycleColor(list)}
                        aria-label={`Change color of ${list.name}`}
                        title="Change color"
                      >
                        <span className="block h-3.5 w-3.5 rounded-full" style={{ backgroundColor: list.color }} />
                      </button>
                      <button
                        type="button"
                        className="rounded p-1 text-sidebar-foreground/70 hover:text-brand-600 dark:hover:text-brand-400"
                        onClick={() => {
                          setEditingId(list.id);
                          setEditName(list.name);
                        }}
                        aria-label={`Rename ${list.name}`}
                      >
                        <PencilIcon className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        className="rounded p-1 text-sidebar-foreground/70 hover:text-error dark:hover:text-error-dark"
                        onClick={() => handleDelete(list)}
                        aria-label={`Delete ${list.name}`}
                      >
                        <TrashIcon className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </SidebarMenuItem>
                )
              )}

              {counts.uncategorized > 0 && (
                <SidebarMenuItem>
                  <SidebarMenuButton
                    isActive={selectedListId === UNCATEGORIZED}
                    onClick={() => onSelect(UNCATEGORIZED)}
                    title="Uncategorized"
                  >
                    <span className="flex h-4 w-4 shrink-0 items-center justify-center">
                      <span className="h-3 w-3 rounded-full border border-dashed border-neutral-400" />
                    </span>
                    <span className="text-sidebar-foreground/80">Uncategorized</span>
                  </SidebarMenuButton>
                  <SidebarMenuBadge>{counts.uncategorized}</SidebarMenuBadge>
                </SidebarMenuItem>
              )}
            </SidebarMenu>

            {isCreating && (
              <div className="mt-1.5 flex items-center gap-1.5 px-1 group-data-[collapsible=icon]:hidden">
                <input
                  autoFocus
                  className="lcrm-input !h-8 !py-1.5 !text-sm"
                  placeholder="New list name…"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleCreate();
                    else if (e.key === 'Escape') {
                      setIsCreating(false);
                      setNewName('');
                    }
                  }}
                />
                <button
                  type="button"
                  className="lcrm-btn-primary shrink-0 !h-8 !py-1.5"
                  onClick={handleCreate}
                  disabled={!newName.trim()}
                >
                  Add
                </button>
              </div>
            )}

            {lists.length === 0 && !isCreating && (
              <p className="px-2 py-2 text-sm text-sidebar-foreground/60 group-data-[collapsible=icon]:hidden">
                No lists yet. Create one to group your target audiences.
              </p>
            )}
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={onOpenNotifications} title="Notifications — reminders & follow-ups">
              <BellIcon className="text-neutral-400" />
              <span>Notifications</span>
            </SidebarMenuButton>
            {dueCount > 0 && (
              <SidebarMenuBadge className="!bg-brand-600 !px-1.5 !text-white dark:!bg-brand-400 dark:!text-neutral-950">
                {dueCount}
              </SidebarMenuBadge>
            )}
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={onOpenSettings} title="Settings">
              <SettingsIcon className="text-neutral-400" />
              <span>Settings</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
