import type { Tag } from '@/types';
import { TAG_COLOR_PALETTE } from '@/types/tag';
import { StorageService } from '@/storage';
import { generateId } from '@/utils/id';

function pickColor(existingCount: number): string {
  return TAG_COLOR_PALETTE[existingCount % TAG_COLOR_PALETTE.length];
}

/** Finds a tag by case-insensitive name, so typing an existing tag name reuses it instead of duplicating. */
export async function findTagByName(name: string): Promise<Tag | null> {
  const tags = await StorageService.getTags();
  const normalized = name.trim().toLowerCase();
  return tags.find((t) => t.name.toLowerCase() === normalized) ?? null;
}

export async function getOrCreateTag(name: string): Promise<Tag> {
  const trimmed = name.trim();
  const existing = await findTagByName(trimmed);
  if (existing) return existing;

  const tags = await StorageService.getTags();
  const tag: Tag = { id: generateId(), name: trimmed, color: pickColor(tags.length) };
  await StorageService.saveTag(tag);
  return tag;
}

export async function searchTags(query: string): Promise<Tag[]> {
  const tags = await StorageService.getTags();
  if (!query.trim()) return tags;
  const normalized = query.trim().toLowerCase();
  return tags.filter((t) => t.name.toLowerCase().includes(normalized));
}

export async function deleteTag(id: string): Promise<void> {
  await StorageService.deleteTag(id);
}
