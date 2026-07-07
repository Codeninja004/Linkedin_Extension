/**
 * Thin, promise-based wrapper around chrome.storage.local.
 *
 * This is the ONLY module in the codebase allowed to touch
 * `chrome.storage.local` directly. Every other layer (services, stores,
 * React components) must go through StorageService instead — that keeps
 * the underlying persistence mechanism swappable and testable, and
 * guarantees we never accidentally reach for `localStorage` (which doesn't
 * work inside a content script's isolated world anyway).
 */

function getLastError(): string | null {
  return chrome.runtime?.lastError?.message ?? null;
}

export function storageGet<T = unknown>(keys: string | string[] | null): Promise<Record<string, T>> {
  return new Promise((resolve, reject) => {
    try {
      chrome.storage.local.get(keys, (result) => {
        const err = getLastError();
        if (err) {
          reject(new Error(`chrome.storage.local.get failed: ${err}`));
          return;
        }
        resolve(result as Record<string, T>);
      });
    } catch (error) {
      reject(error);
    }
  });
}

export function storageSet(items: Record<string, unknown>): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      chrome.storage.local.set(items, () => {
        const err = getLastError();
        if (err) {
          reject(new Error(`chrome.storage.local.set failed: ${err}`));
          return;
        }
        resolve();
      });
    } catch (error) {
      reject(error);
    }
  });
}

export function storageRemove(keys: string | string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      chrome.storage.local.remove(keys, () => {
        const err = getLastError();
        if (err) {
          reject(new Error(`chrome.storage.local.remove failed: ${err}`));
          return;
        }
        resolve();
      });
    } catch (error) {
      reject(error);
    }
  });
}

export function onStorageChanged(
  callback: (changes: Record<string, chrome.storage.StorageChange>, areaName: string) => void
): () => void {
  const listener = (changes: Record<string, chrome.storage.StorageChange>, areaName: string) => {
    callback(changes, areaName);
  };
  chrome.storage.onChanged.addListener(listener);
  return () => chrome.storage.onChanged.removeListener(listener);
}
