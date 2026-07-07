import { storageGet, storageSet } from '@/storage/chromeStorage';
import { createDefaultSchema } from '@/storage/defaults';

/**
 * Seeds chrome.storage.local with an empty schema (+ starter templates) the
 * very first time the extension runs. Safe to call on every startup — it
 * only writes if the "settings" key is completely absent.
 */
export async function ensureStorageInitialized(): Promise<void> {
  const result = await storageGet('settings');
  if (result.settings !== undefined) return;

  const schema = createDefaultSchema();
  await storageSet({ ...schema });
  console.info('[LinkedIn CRM] Initialized local storage with default schema.');
}
