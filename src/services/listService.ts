import type { ContactList } from '@/types';
import { LIST_COLOR_PALETTE } from '@/types/list';
import { StorageService } from '@/storage';
import { generateId } from '@/utils/id';
import { nowIso } from '@/utils/date';

function pickColor(existingCount: number): string {
  return LIST_COLOR_PALETTE[existingCount % LIST_COLOR_PALETTE.length];
}

/** Finds a list by case-insensitive name, so reusing a name doesn't create a duplicate. */
export async function findListByName(name: string): Promise<ContactList | null> {
  const lists = await StorageService.getLists();
  const normalized = name.trim().toLowerCase();
  return lists.find((l) => l.name.toLowerCase() === normalized) ?? null;
}

export interface CreateListInput {
  name: string;
  color?: string;
  description?: string;
}

/** Creates a new list. Throws if the name is blank; reuses an existing list with the same name instead of duplicating. */
export async function createList(input: CreateListInput): Promise<ContactList> {
  const name = input.name.trim();
  if (!name) throw new Error('A list needs a name.');

  const existing = await findListByName(name);
  if (existing) return existing;

  const lists = await StorageService.getLists();
  const now = nowIso();
  const list: ContactList = {
    id: generateId(),
    name,
    color: input.color ?? pickColor(lists.length),
    description: input.description?.trim() || undefined,
    createdAt: now,
    updatedAt: now,
  };
  await StorageService.saveList(list);
  return list;
}

/** Convenience for "type a name, get a list" flows (e.g. inline list creation on a contact). */
export async function getOrCreateList(name: string): Promise<ContactList> {
  const existing = await findListByName(name);
  if (existing) return existing;
  return createList({ name });
}

export async function updateList(
  id: string,
  updates: Partial<Pick<ContactList, 'name' | 'color' | 'description'>>
): Promise<ContactList | null> {
  const list = await StorageService.getList(id);
  if (!list) return null;

  const next: ContactList = {
    ...list,
    ...(updates.name !== undefined ? { name: updates.name.trim() || list.name } : {}),
    ...(updates.color !== undefined ? { color: updates.color } : {}),
    ...(updates.description !== undefined ? { description: updates.description.trim() || undefined } : {}),
    updatedAt: nowIso(),
  };
  await StorageService.saveList(next);
  return next;
}

export async function deleteList(id: string): Promise<void> {
  await StorageService.deleteList(id);
}
