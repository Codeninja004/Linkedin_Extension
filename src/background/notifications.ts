import type { Contact } from '@/types';
import { StorageService } from '@/storage';
import { getDueReminders, markNotificationSent } from '@/services/reminderService';

const ICON_URL = chrome.runtime.getURL('icons/icon128.png');

function notifyContact(contact: Contact): void {
  chrome.notifications.create(
    contact.id,
    {
      type: 'basic',
      iconUrl: ICON_URL,
      title: `Reminder: ${contact.name || 'LinkedIn contact'}`,
      message: contact.reminder.note || 'Follow up with this contact.',
      contextMessage: contact.company || contact.headline || undefined,
      priority: 2,
    },
    () => {
      if (chrome.runtime.lastError) {
        console.error('[LinkedIn CRM] Failed to create notification:', chrome.runtime.lastError.message);
      }
    }
  );
}

/** Scans all contacts for due, not-yet-notified reminders and fires a Chrome notification for each. */
export async function checkAndNotifyDueReminders(): Promise<void> {
  const settings = await StorageService.getSettings();
  if (!settings.notificationsEnabled) return;

  const due = await getDueReminders();
  for (const contact of due) {
    notifyContact(contact);
    await markNotificationSent(contact.id);
  }
}

/** Clicking a reminder notification opens that contact's LinkedIn profile. */
export function registerNotificationClickHandler(): void {
  chrome.notifications.onClicked.addListener(async (notificationId) => {
    const contact = await StorageService.getContact(notificationId);
    if (!contact) return;

    await chrome.tabs.create({ url: contact.linkedinUrl });
    chrome.notifications.clear(notificationId);
  });
}
