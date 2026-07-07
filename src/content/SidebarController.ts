import { createRoot, type Root } from 'react-dom/client';
import { createElement } from 'react';
import tailwindStyles from '@/sidebar/styles/tailwind.css?inline';
import { SidebarApp } from '@/sidebar/App';
import { createLogger } from '@/utils/logger';

const HOST_ID = 'linkedin-crm-sidebar-host';

const log = createLogger('SidebarController');

/**
 * Owns the lifecycle of the injected sidebar: a single Shadow DOM host
 * appended to <body>, with its own React root rendered inside.
 *
 * There is exactly one instance of this per content-script execution (see
 * the module-level singleton export at the bottom), and its `mount()` is
 * fully idempotent — calling it multiple times (e.g. defensively, on every
 * detected profile) never creates a second host or a second React root.
 * Profile changes are reflected by the Zustand store updating underneath
 * the already-mounted React tree, not by remounting anything here.
 */
class SidebarController {
  private host: HTMLDivElement | null = null;
  private reactRoot: Root | null = null;

  isMounted(): boolean {
    return this.reactRoot !== null;
  }

  mount(): void {
    if (this.reactRoot) {
      log.debug('mount() called but sidebar is already mounted — no-op.');
      return;
    }

    // Defensive cleanup: if a host element from a previous, now-orphaned
    // instance of this controller is somehow still in the DOM (e.g. a
    // duplicate content-script injection), remove it before creating a
    // fresh one rather than risking two overlapping shadow roots.
    const orphan = document.getElementById(HOST_ID);
    if (orphan) {
      log.warn('Found an orphaned sidebar host from a previous injection — removing it.');
      orphan.remove();
    }

    const host = document.createElement('div');
    host.id = HOST_ID;
    document.body.appendChild(host);

    const shadowRoot = host.attachShadow({ mode: 'open' });

    const style = document.createElement('style');
    style.textContent = tailwindStyles;
    shadowRoot.appendChild(style);

    const appContainer = document.createElement('div');
    appContainer.id = 'linkedin-crm-app';
    shadowRoot.appendChild(appContainer);

    this.host = host;
    this.reactRoot = createRoot(appContainer);
    this.reactRoot.render(createElement(SidebarApp));

    log.info('Sidebar mounted.');
  }

  /** Tears down the React tree and removes the host element. Not used in normal operation, but keeps the controller fully reversible for hygiene/testability. */
  unmount(): void {
    if (!this.reactRoot) return;

    this.reactRoot.unmount();
    this.host?.remove();
    this.reactRoot = null;
    this.host = null;

    log.info('Sidebar unmounted.');
  }
}

/**
 * A single shared instance. Content scripts execute once per page context
 * (SPA navigation doesn't re-run this module), so a module-level singleton
 * is sufficient — combined with the `window.__linkedInCRMInjected` guard in
 * `index.tsx`, this makes "never create duplicate sidebars" hold even in
 * the rare case the script is injected more than once.
 */
export const sidebarController = new SidebarController();
