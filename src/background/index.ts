/**
 * Background service worker.
 *
 * Owns everything that must keep running independent of any open tab:
 * seeding initial storage, scheduling the reminder-check alarm, firing
 * Chrome notifications when a reminder comes due, and opening the right
 * LinkedIn profile when a notification is clicked. Contains no UI logic —
 * all rendering happens in the popup, dashboard, and content-script sidebar.
 */
import { ensureStorageInitialized } from './init';
import { REMINDER_CHECK_ALARM, scheduleReminderAlarm } from './alarms';
import { checkAndNotifyDueReminders, registerNotificationClickHandler } from './notifications';

async function bootstrap(): Promise<void> {
  await ensureStorageInitialized();
  await scheduleReminderAlarm();
  await checkAndNotifyDueReminders();
}

chrome.runtime.onInstalled.addListener(() => {
  bootstrap().catch((error) => console.error('[LinkedIn CRM] onInstalled bootstrap failed:', error));
});

chrome.runtime.onStartup.addListener(() => {
  bootstrap().catch((error) => console.error('[LinkedIn CRM] onStartup bootstrap failed:', error));
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name !== REMINDER_CHECK_ALARM) return;
  checkAndNotifyDueReminders().catch((error) =>
    console.error('[LinkedIn CRM] Reminder check failed:', error)
  );
});

registerNotificationClickHandler();

// Service workers can be terminated and restarted by Chrome at any time;
// make sure storage/alarms are in a good state as soon as this file runs,
// not only on the onInstalled/onStartup events.
bootstrap().catch((error) => console.error('[LinkedIn CRM] Initial bootstrap failed:', error));
