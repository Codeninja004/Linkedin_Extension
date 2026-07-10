import { StorageService } from '@/storage';
import { validateBackupPayload } from '@/utils/validation';
import { toCsv } from '@/utils/csv';
import type { BackupPayload } from '@/types';
import { PIPELINE_STAGE_LABELS, PRIORITY_LABELS, TEMPERATURE_LABELS } from '@/types/contact';

/** Triggers a browser download of a text blob. Returns false (instead of throwing) if the download couldn't be created. */
function downloadTextFile(content: string, filename: string, mimeType: string): boolean {
  let url: string | null = null;
  try {
    const blob = new Blob([content], { type: mimeType });
    url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    return true;
  } catch (error) {
    console.error(`[LinkedIn CRM] Failed to export "${filename}":`, error);
    return false;
  } finally {
    if (url) URL.revokeObjectURL(url);
  }
}

/** Triggers a browser download of the full local dataset as a JSON file — the format used for full backup/restore between devices. */
export async function exportBackupToFile(): Promise<boolean> {
  try {
    const payload = await StorageService.exportAll();
    const date = new Date().toISOString().slice(0, 10);
    return downloadTextFile(JSON.stringify(payload, null, 2), `linkedin-crm-backup-${date}.json`, 'application/json');
  } catch (error) {
    console.error('[LinkedIn CRM] Failed to export backup:', error);
    return false;
  }
}

const CSV_HEADERS = [
  'Name',
  'Headline',
  'Company',
  'Location',
  'LinkedIn URL',
  'Stage',
  'Priority',
  'Temperature',
  'Lists',
  'Tags',
  'Note',
  'Reminder Date',
  'Reminder Time',
  'Reminder Note',
  'Created At',
  'Last Viewed',
];

/**
 * Exports all contacts as a CSV file — opens directly in Google Sheets,
 * Excel, or Numbers without any conversion step, unlike the JSON backup
 * (which is optimized for round-tripping back into this extension, not for
 * spreadsheet viewing).
 */
export async function exportContactsToCsv(): Promise<boolean> {
  try {
    const [contacts, tags, lists] = await Promise.all([
      StorageService.getContacts(),
      StorageService.getTags(),
      StorageService.getLists(),
    ]);
    const tagNameById = new Map(tags.map((t) => [t.id, t.name]));
    const listNameById = new Map(lists.map((l) => [l.id, l.name]));

    const rows = contacts.map((c) => [
      c.name,
      c.headline,
      c.company,
      c.location,
      c.linkedinUrl,
      PIPELINE_STAGE_LABELS[c.stage],
      PRIORITY_LABELS[c.priority],
      TEMPERATURE_LABELS[c.temperature],
      (c.listIds ?? []).map((id) => listNameById.get(id)).filter(Boolean).join('; '),
      c.tagIds.map((id) => tagNameById.get(id)).filter(Boolean).join('; '),
      c.note.content,
      c.reminder.date ?? '',
      c.reminder.time ?? '',
      c.reminder.note,
      c.createdAt,
      c.lastViewed,
    ]);

    const csv = toCsv([CSV_HEADERS, ...rows]);
    const date = new Date().toISOString().slice(0, 10);
    // A UTF-8 BOM so Excel (which otherwise guesses the wrong encoding for
    // non-ASCII names) opens this correctly rather than mangling accents.
    return downloadTextFile('\uFEFF' + csv, `linkedin-crm-contacts-${date}.csv`, 'text/csv;charset=utf-8;');
  } catch (error) {
    console.error('[LinkedIn CRM] Failed to export contacts as CSV:', error);
    return false;
  }
}

export interface ImportResult {
  success: boolean;
  error?: string;
  contactCount?: number;
}

/** Parses, validates, and — if valid — persists a backup JSON file, overwriting current local data. */
export async function importBackupFromFile(file: File): Promise<ImportResult> {
  let raw: unknown;
  try {
    const text = await file.text();
    raw = JSON.parse(text);
  } catch {
    return { success: false, error: 'File is not valid JSON.' };
  }

  const result = validateBackupPayload(raw);
  if (!result.valid) {
    return { success: false, error: result.error };
  }

  const payload: BackupPayload = result.data;
  try {
    await StorageService.importAll(payload);
    return { success: true, contactCount: Object.keys(payload.data.contacts).length };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Failed to write imported data.' };
  }
}
