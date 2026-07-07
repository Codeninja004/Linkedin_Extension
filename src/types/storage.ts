import type { Contact } from './contact';
import type { Tag } from './tag';
import type { Template } from './template';
import type { Settings } from './settings';

/**
 * Shape of everything persisted in chrome.storage.local, keyed by top-level
 * storage key. Contacts are keyed by id for O(1) lookups without scanning
 * the whole collection on every profile visit.
 */
export interface StorageSchema {
  contacts: Record<string, Contact>;
  tags: Record<string, Tag>;
  templates: Record<string, Template>;
  settings: Settings;
}

export const STORAGE_KEYS: Record<keyof StorageSchema, keyof StorageSchema> = {
  contacts: 'contacts',
  tags: 'tags',
  templates: 'templates',
  settings: 'settings',
};

/** Full backup shape produced by Export / consumed by Import. */
export interface BackupPayload {
  version: 1;
  exportedAt: string;
  data: StorageSchema;
}
