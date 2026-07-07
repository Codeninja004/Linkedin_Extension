import type {
  Contact,
  Tag,
  Template,
  Settings,
  StorageSchema,
  BackupPayload,
} from '@/types';
import { DEFAULT_SETTINGS } from '@/types/settings';
import { storageGet, storageSet, onStorageChanged } from './chromeStorage';
import { starterTemplatesFallback } from './defaults';

/**
 * StorageService is the single abstraction the rest of the app (UI, hooks,
 * background/content scripts) uses to read and write persisted data.
 *
 * No React component and no other module should call chrome.storage.local
 * directly — that keeps persistence swappable and keeps error handling
 * (corrupted data, missing keys, permission failures) in one place so the
 * extension never crashes because of a storage hiccup.
 */
class StorageServiceImpl {
  // ---------------------------------------------------------------------
  // Low-level record access
  // ---------------------------------------------------------------------

  private async getRecord<K extends keyof StorageSchema>(
    key: K,
    fallback: StorageSchema[K]
  ): Promise<StorageSchema[K]> {
    try {
      const result = await storageGet<StorageSchema[K]>(key);
      const value = result[key];
      if (value === undefined || value === null) return fallback;
      return value;
    } catch (error) {
      console.error(`[StorageService] Failed to read "${key}", falling back to default.`, error);
      return fallback;
    }
  }

  private async setRecord<K extends keyof StorageSchema>(
    key: K,
    value: StorageSchema[K]
  ): Promise<void> {
    try {
      await storageSet({ [key]: value });
    } catch (error) {
      console.error(`[StorageService] Failed to write "${key}".`, error);
      throw error;
    }
  }

  /** Subscribe to live storage changes (used by popup/dashboard/sidebar to stay in sync across tabs). */
  onChange(callback: () => void): () => void {
    return onStorageChanged((_changes, areaName) => {
      if (areaName !== 'local') return;
      callback();
    });
  }

  // ---------------------------------------------------------------------
  // Contacts
  // ---------------------------------------------------------------------

  async getContacts(): Promise<Contact[]> {
    const contacts = await this.getRecord('contacts', {});
    return Object.values(contacts);
  }

  async getContact(id: string): Promise<Contact | null> {
    const contacts = await this.getRecord('contacts', {});
    return contacts[id] ?? null;
  }

  async getContactByUrl(linkedinUrl: string): Promise<Contact | null> {
    const normalized = normalizeLinkedInUrl(linkedinUrl);
    const contacts = await this.getRecord('contacts', {});
    return (
      Object.values(contacts).find((c) => normalizeLinkedInUrl(c.linkedinUrl) === normalized) ??
      null
    );
  }

  async saveContact(contact: Contact): Promise<void> {
    const contacts = await this.getRecord('contacts', {});
    contacts[contact.id] = contact;
    await this.setRecord('contacts', contacts);
  }

  async deleteContact(id: string): Promise<void> {
    const contacts = await this.getRecord('contacts', {});
    delete contacts[id];
    await this.setRecord('contacts', contacts);
  }

  // ---------------------------------------------------------------------
  // Tags
  // ---------------------------------------------------------------------

  async getTags(): Promise<Tag[]> {
    const tags = await this.getRecord('tags', {});
    return Object.values(tags);
  }

  async saveTag(tag: Tag): Promise<void> {
    const tags = await this.getRecord('tags', {});
    tags[tag.id] = tag;
    await this.setRecord('tags', tags);
  }

  async deleteTag(id: string): Promise<void> {
    const tags = await this.getRecord('tags', {});
    delete tags[id];
    await this.setRecord('tags', tags);

    // Cascade: strip the deleted tag id from every contact that referenced it.
    const contacts = await this.getRecord('contacts', {});
    let touched = false;
    for (const contact of Object.values(contacts)) {
      if (contact.tagIds.includes(id)) {
        contact.tagIds = contact.tagIds.filter((t) => t !== id);
        touched = true;
      }
    }
    if (touched) await this.setRecord('contacts', contacts);
  }

  // ---------------------------------------------------------------------
  // Templates
  // ---------------------------------------------------------------------

  async getTemplates(): Promise<Template[]> {
    const templates = await this.getRecord('templates', starterTemplatesFallback());
    return Object.values(templates);
  }

  async saveTemplate(template: Template): Promise<void> {
    const templates = await this.getRecord('templates', {});
    templates[template.id] = template;
    await this.setRecord('templates', templates);
  }

  async deleteTemplate(id: string): Promise<void> {
    const templates = await this.getRecord('templates', {});
    delete templates[id];
    await this.setRecord('templates', templates);
  }

  // ---------------------------------------------------------------------
  // Settings
  // ---------------------------------------------------------------------

  async getSettings(): Promise<Settings> {
    return this.getRecord('settings', { ...DEFAULT_SETTINGS });
  }

  async saveSettings(settings: Settings): Promise<void> {
    await this.setRecord('settings', settings);
  }

  // ---------------------------------------------------------------------
  // Export / Import
  // ---------------------------------------------------------------------

  async exportAll(): Promise<BackupPayload> {
    const [contactsList, tagsList, templatesList, settings] = await Promise.all([
      this.getContacts(),
      this.getTags(),
      this.getTemplates(),
      this.getSettings(),
    ]);

    return {
      version: 1,
      exportedAt: new Date().toISOString(),
      data: {
        contacts: Object.fromEntries(contactsList.map((c) => [c.id, c])),
        tags: Object.fromEntries(tagsList.map((t) => [t.id, t])),
        templates: Object.fromEntries(templatesList.map((t) => [t.id, t])),
        settings,
      },
    };
  }

  /** Overwrites all local data with a previously-validated backup. */
  async importAll(payload: BackupPayload): Promise<void> {
    await Promise.all([
      this.setRecord('contacts', payload.data.contacts),
      this.setRecord('tags', payload.data.tags),
      this.setRecord('templates', payload.data.templates),
      this.setRecord('settings', payload.data.settings),
    ]);
  }
}

function normalizeLinkedInUrl(url: string): string {
  try {
    const u = new URL(url);
    return `${u.origin}${u.pathname}`.replace(/\/$/, '').toLowerCase();
  } catch {
    return url.trim().toLowerCase().replace(/\/$/, '');
  }
}

export const StorageService = new StorageServiceImpl();
