export interface Reminder {
  enabled: boolean;
  /** ISO date string, e.g. "2026-07-10" */
  date: string | null;
  /** 24h time string, e.g. "14:30" */
  time: string | null;
  completed: boolean;
  /** Set once the background script has fired a Chrome notification for this reminder. */
  notificationSent: boolean;
  note: string;
}

export const createEmptyReminder = (): Reminder => ({
  enabled: false,
  date: null,
  time: null,
  completed: false,
  notificationSent: false,
  note: '',
});
