import { createLogger } from '@/utils/logger';
import { debounce } from '@/utils/debounce';
import { isProfileUrl, hasProfileContentRendered, canonicalProfileUrl } from './linkedinScraper';

const log = createLogger('ProfileWatcher');

const MUTATION_DEBOUNCE_MS = 200;
const RETRY_DELAY_MS = 300;
const MAX_RETRIES = 25; // ~7.5s of retrying before pausing (resumes on the next DOM mutation, so this isn't a hard timeout)

export type ProfileWatcherCallback = (canonicalUrl: string) => void;

/**
 * Watches for LinkedIn SPA navigation and calls back exactly once per
 * distinct profile, only once that profile's content has actually rendered.
 *
 * LinkedIn never does a full page reload when moving between profiles, so
 * detecting "the user is now looking at profile X and its content is ready"
 * requires three things working together:
 *
 *  1. Patching history.pushState/replaceState (+ listening for popstate) to
 *     learn about URL changes the instant they happen.
 *  2. A single persistent MutationObserver on <html> to know when the DOM
 *     has changed at all, since content streams in after the URL updates.
 *  3. An epoch counter: every time the URL changes, the epoch is bumped.
 *     Any in-flight retry loop capturing an older epoch checks it before
 *     firing and abandons itself if superseded — this is what prevents the
 *     classic race where a slow retry for profile A resolves *after* the
 *     user has already navigated to profile B, and incorrectly reports A's
 *     (or worse, stale/mixed) content as if it belonged to B.
 *
 * This class owns no rendering logic — it only decides *when* a profile is
 * ready to be scraped, via `onReady`.
 */
export class ProfileWatcher {
  private epoch = 0;
  private lastReadyUrl: string | null = null;
  private pendingUrl: string | null = null;
  private retryTimer: ReturnType<typeof setTimeout> | null = null;
  private mutationObserver: MutationObserver | null = null;
  private started = false;

  private readonly originalPushState = history.pushState.bind(history);
  private readonly originalReplaceState = history.replaceState.bind(history);
  private readonly onReady: ProfileWatcherCallback;

  constructor(onReady: ProfileWatcherCallback) {
    this.onReady = onReady;
  }

  start(): void {
    if (this.started) {
      log.warn('start() called while already running — ignoring.');
      return;
    }
    this.started = true;

    history.pushState = (...args: Parameters<History['pushState']>) => {
      this.originalPushState(...args);
      this.handleUrlChange('pushState');
    };
    history.replaceState = (...args: Parameters<History['replaceState']>) => {
      this.originalReplaceState(...args);
      this.handleUrlChange('replaceState');
    };
    window.addEventListener('popstate', this.handlePopState);

    this.mutationObserver = new MutationObserver(this.debouncedMutationCheck);
    this.mutationObserver.observe(document.documentElement, { childList: true, subtree: true });

    log.info('Started watching for LinkedIn profile navigation.');

    // Cover the "extension attaches after the profile already rendered"
    // case (direct load, or a page refresh while already on a profile).
    this.handleUrlChange('initial');
  }

  /** Stops all observation and restores the patched history methods. Safe to call multiple times. */
  stop(): void {
    if (!this.started) return;
    this.started = false;

    history.pushState = this.originalPushState;
    history.replaceState = this.originalReplaceState;
    window.removeEventListener('popstate', this.handlePopState);

    this.mutationObserver?.disconnect();
    this.mutationObserver = null;

    this.debouncedMutationCheck.cancel();
    this.clearRetryTimer();

    log.info('Stopped.');
  }

  private handlePopState = (): void => this.handleUrlChange('popstate');

  private debouncedMutationCheck = debounce(() => this.handleUrlChange('mutation'), MUTATION_DEBOUNCE_MS);

  private handleUrlChange(source: string): void {
    const rawUrl = window.location.href;

    if (!isProfileUrl(rawUrl)) {
      // Left profile territory entirely (feed, search, messaging, etc.) —
      // reset so that returning to the *same* profile later is treated as
      // a fresh detection rather than being silently deduped.
      if (this.pendingUrl !== null || this.lastReadyUrl !== null) {
        log.debug(`Navigated away from profile pages (source: ${source}).`);
      }
      this.epoch += 1;
      this.clearRetryTimer();
      this.pendingUrl = null;
      this.lastReadyUrl = null;
      return;
    }

    const url = canonicalProfileUrl(rawUrl) ?? rawUrl;

    if (url === this.lastReadyUrl) {
      // Already fully detected and reported for this exact profile — most
      // calls here come from the mutation observer firing on unrelated
      // in-page changes (likes, ads, lazy images) while the user stays put.
      return;
    }

    if (url === this.pendingUrl) {
      // A retry loop for this exact profile is already in flight; let it
      // continue rather than restarting from attempt 0 on every mutation.
      return;
    }

    log.debug(`New profile URL detected (source: ${source}): ${url}`);
    this.epoch += 1;
    this.pendingUrl = url;
    this.clearRetryTimer();
    this.attemptDetection(url, this.epoch, 0);
  }

  private attemptDetection(url: string, epoch: number, attempt: number): void {
    if (epoch !== this.epoch) {
      log.debug(`Abandoning stale detection attempt for ${url} (superseded by a newer navigation).`);
      return;
    }

    if (!hasProfileContentRendered()) {
      if (attempt >= MAX_RETRIES) {
        log.warn(`Gave up waiting for profile content to render after ${MAX_RETRIES} retries: ${url}`);
        this.pendingUrl = null;
        return;
      }

      this.retryTimer = setTimeout(() => {
        this.attemptDetection(url, epoch, attempt + 1);
      }, RETRY_DELAY_MS);
      return;
    }

    log.info(`Profile ready after ${attempt} retr${attempt === 1 ? 'y' : 'ies'}: ${url}`);
    this.lastReadyUrl = url;
    this.pendingUrl = null;
    this.onReady(url);
  }

  private clearRetryTimer(): void {
    if (this.retryTimer) {
      clearTimeout(this.retryTimer);
      this.retryTimer = null;
    }
  }
}
