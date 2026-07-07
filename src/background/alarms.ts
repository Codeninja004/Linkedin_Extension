import { StorageService } from '@/storage';

export const REMINDER_CHECK_ALARM = 'linkedin-crm-reminder-check';

/** (Re)creates the recurring alarm that drives reminder checks, honoring the user's configured interval. */
export async function scheduleReminderAlarm(): Promise<void> {
  const settings = await StorageService.getSettings();
  const periodInMinutes = Math.max(1, settings.reminderCheckIntervalMinutes || 5);

  chrome.alarms.create(REMINDER_CHECK_ALARM, {
    periodInMinutes,
    delayInMinutes: 0.1,
  });
}
