import { isProfileUrl, scrapeProfileFromDom } from './linkedinScraper';
import { useContactStore } from '@/store/contactStore';
import { useUIStore } from '@/store/uiStore';
import { createLogger } from '@/utils/logger';

const log = createLogger('detectProfile');

export type DetectFailureReason = 'not-a-profile-page' | 'no-content-found' | 'storage-error';

export type DetectResult = { success: true } | { success: false; reason: DetectFailureReason };

/**
 * Scrapes the current page and stages it for the sidebar.
 *
 * This is the single code path for "a profile is ready, go look at it" —
 * used both by ProfileWatcher when it detects a profile automatically, and
 * by the sidebar's manual "Detect Profile" button. It does NOT create a
 * contact: if this profile is already on the list, its record loads and
 * refreshes as before; if it isn't, it's staged as a `pendingProfile`
 * preview and the user must explicitly click "Add Profile to List" for
 * anything to be written to chrome.storage.local.
 */
export async function detectProfileNow(): Promise<DetectResult> {
  const url = window.location.href;

  if (!isProfileUrl(url)) {
    log.warn(`Detect requested on a non-profile URL: ${url}`);
    return { success: false, reason: 'not-a-profile-page' };
  }

  const profile = scrapeProfileFromDom();
  if (!profile.name) {
    log.warn(`Detect found no name for ${url}.`);
    return { success: false, reason: 'no-content-found' };
  }

  try {
    await useContactStore.getState().detectProfile(profile);
    useUIStore.getState().setSidebarOpen(true);
    return { success: true };
  } catch (error) {
    log.error('Failed to detect profile:', error);
    return { success: false, reason: 'storage-error' };
  }
}
