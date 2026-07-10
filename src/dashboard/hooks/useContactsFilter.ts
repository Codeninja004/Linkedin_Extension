import { useMemo, useState } from 'react';
import type { Contact, PipelineStage, Priority } from '@/types';

export type SortKey = 'name' | 'company' | 'stage' | 'priority' | 'lastViewed';
export type SortDir = 'asc' | 'desc';

/** Sentinel `listId` value that matches contacts belonging to no list at all. */
export const UNCATEGORIZED = '__uncategorized__';

export interface DashboardFilters {
  stage: PipelineStage | 'all';
  priority: Priority | 'all';
  tagId: string | 'all';
  /** A list id, `'all'` for every contact, or `UNCATEGORIZED` for contacts in no list. */
  listId: string | 'all';
  company: string | 'all';
  keyword: string;
}

const DEFAULT_FILTERS: DashboardFilters = {
  stage: 'all',
  priority: 'all',
  tagId: 'all',
  listId: 'all',
  company: 'all',
  keyword: '',
};

const PRIORITY_RANK: Record<Priority, number> = { low: 0, medium: 1, high: 2 };

function reminderDueTimestamp(contact: Contact): number {
  if (!contact.reminder.enabled || contact.reminder.completed || !contact.reminder.date) {
    return Number.POSITIVE_INFINITY;
  }
  return new Date(`${contact.reminder.date}T${contact.reminder.time ?? '23:59'}`).getTime();
}

export function useContactsFilter(contacts: Contact[]) {
  const [filters, setFilters] = useState<DashboardFilters>(DEFAULT_FILTERS);
  const [sortKey, setSortKey] = useState<SortKey>('lastViewed');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const companies = useMemo(
    () => Array.from(new Set(contacts.map((c) => c.company).filter(Boolean))).sort(),
    [contacts]
  );

  function toggleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  }

  const filtered = useMemo(() => {
    const keyword = filters.keyword.trim().toLowerCase();

    let result = contacts.filter((c) => {
      if (filters.stage !== 'all' && c.stage !== filters.stage) return false;
      if (filters.priority !== 'all' && c.priority !== filters.priority) return false;
      if (filters.tagId !== 'all' && !c.tagIds.includes(filters.tagId)) return false;
      if (filters.listId === UNCATEGORIZED) {
        if ((c.listIds ?? []).length > 0) return false;
      } else if (filters.listId !== 'all' && !(c.listIds ?? []).includes(filters.listId)) {
        return false;
      }
      if (filters.company !== 'all' && c.company !== filters.company) return false;
      if (
        keyword &&
        !`${c.name} ${c.company} ${c.headline} ${c.note.content}`.toLowerCase().includes(keyword)
      ) {
        return false;
      }
      return true;
    });

    result = [...result].sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case 'name':
          cmp = a.name.localeCompare(b.name);
          break;
        case 'company':
          cmp = a.company.localeCompare(b.company);
          break;
        case 'stage':
          cmp = a.stage.localeCompare(b.stage);
          break;
        case 'priority':
          cmp = PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
          break;
        case 'lastViewed':
          cmp = new Date(a.lastViewed).getTime() - new Date(b.lastViewed).getTime();
          break;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return result;
  }, [contacts, filters, sortKey, sortDir]);

  return {
    filters,
    setFilters,
    companies,
    filtered,
    sortKey,
    sortDir,
    toggleSort,
    reminderDueTimestamp,
  };
}
