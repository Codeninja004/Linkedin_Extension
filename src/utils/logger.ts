/**
 * Namespaced console logger for the content script and background worker.
 *
 * Chrome extensions have no visible UI for "what is the extension doing
 * right now" — the only debugging surface is the console (page console for
 * content scripts, the service worker's own console for background.js).
 * Consistent, prefixed logging is the main tool available for diagnosing
 * profile-detection issues on a live LinkedIn page, so every log line is
 * tagged with both the extension name and the originating module.
 */
export interface Logger {
  debug: (...args: unknown[]) => void;
  info: (...args: unknown[]) => void;
  warn: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
}

export function createLogger(scope: string): Logger {
  const prefix = `[LinkedIn CRM:${scope}]`;
  return {
    debug: (...args) => console.debug(prefix, ...args),
    info: (...args) => console.info(prefix, ...args),
    warn: (...args) => console.warn(prefix, ...args),
    error: (...args) => console.error(prefix, ...args),
  };
}
