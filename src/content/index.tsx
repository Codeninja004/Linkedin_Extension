/**
 * Content script entry point — injected into every linkedin.com page.
 *
 * Responsibilities: detect when the user is viewing a profile (via
 * ProfileWatcher), scrape that profile's public fields, load-or-create its
 * Contact record, and mount the React sidebar (via SidebarController).
 *
 * This module intentionally contains no detection or rendering logic of
 * its own — it just wires ProfileWatcher, detectProfileNow, and
 * SidebarController together, so each piece stays independently testable.
 */
import { sidebarController } from './SidebarController';
import { ProfileWatcher } from './ProfileWatcher';
import { detectProfileNow } from './detectProfile';
import { createLogger } from '@/utils/logger';

const log = createLogger('content');

/** Guards against the content script's side effects running more than once in the same page context. */
const INJECTED_FLAG = '__linkedInCRMInjected';

function handleProfileReady(url: string): void {
  detectProfileNow().then((result) => {
    if (!result.success) {
      // ProfileWatcher already confirmed a name heading was present before
      // calling us, so a failure here almost always means the specific
      // field selectors missed on this layout — the user can still force
      // it via the sidebar's manual "Detect Profile" button.
      log.warn(`Automatic detection did not complete for ${url}: ${result.reason}`);
    }
  });
}

function init(): void {
  const win = window as typeof window & { [INJECTED_FLAG]?: boolean };
  if (win[INJECTED_FLAG]) {
    log.warn('Content script already initialized in this page context — skipping re-init.');
    return;
  }
  win[INJECTED_FLAG] = true;

  sidebarController.mount();
  new ProfileWatcher(handleProfileReady).start();

  log.info('Initialized.');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init, { once: true });
} else {
  init();
}
