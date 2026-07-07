import type { BackupPayload, Contact, Tag, Template, Settings } from '@/types';

function isString(v: unknown): v is string {
  return typeof v === 'string';
}

function isBoolean(v: unknown): v is boolean {
  return typeof v === 'boolean';
}

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function isValidContact(value: unknown): value is Contact {
  if (!isObject(value)) return false;
  const c = value;
  return (
    isString(c.id) &&
    isString(c.linkedinUrl) &&
    isString(c.name) &&
    isString(c.stage) &&
    isString(c.priority) &&
    isString(c.temperature) &&
    Array.isArray(c.tagIds) &&
    isObject(c.note) &&
    isObject(c.reminder) &&
    Array.isArray(c.activities) &&
    isString(c.createdAt) &&
    isString(c.updatedAt)
  );
}

function isValidTag(value: unknown): value is Tag {
  if (!isObject(value)) return false;
  return isString(value.id) && isString(value.name) && isString(value.color);
}

function isValidTemplate(value: unknown): value is Template {
  if (!isObject(value)) return false;
  return isString(value.id) && isString(value.name) && isString(value.content);
}

function isValidSettings(value: unknown): value is Settings {
  if (!isObject(value)) return false;
  return isString(value.theme) && isBoolean(value.sidebarCollapsedByDefault);
}

/**
 * Defensive validation for imported backup JSON. We never trust file
 * contents blindly — malformed or hand-edited backups must fail loudly
 * instead of corrupting chrome.storage.local.
 */
export function validateBackupPayload(raw: unknown): { valid: true; data: BackupPayload } | { valid: false; error: string } {
  if (!isObject(raw)) {
    return { valid: false, error: 'Backup file is not a valid JSON object.' };
  }

  if (raw.version !== 1) {
    return { valid: false, error: `Unsupported backup version: ${String(raw.version)}` };
  }

  if (!isObject(raw.data)) {
    return { valid: false, error: 'Backup is missing a "data" object.' };
  }

  const { data } = raw;
  const { contacts, tags, templates, settings } = data as Record<string, unknown>;

  if (!isObject(contacts) || !Object.values(contacts).every(isValidContact)) {
    return { valid: false, error: 'Backup contains invalid or corrupted contact records.' };
  }

  if (!isObject(tags) || !Object.values(tags).every(isValidTag)) {
    return { valid: false, error: 'Backup contains invalid or corrupted tag records.' };
  }

  if (!isObject(templates) || !Object.values(templates).every(isValidTemplate)) {
    return { valid: false, error: 'Backup contains invalid or corrupted template records.' };
  }

  if (!isValidSettings(settings)) {
    return { valid: false, error: 'Backup contains invalid or corrupted settings.' };
  }

  return {
    valid: true,
    data: {
      version: 1,
      exportedAt: typeof raw.exportedAt === 'string' ? raw.exportedAt : new Date().toISOString(),
      data: {
        contacts: contacts as Record<string, Contact>,
        tags: tags as Record<string, Tag>,
        templates: templates as Record<string, Template>,
        settings,
      },
    },
  };
}
