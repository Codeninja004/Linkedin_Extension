import type { Contact, Reminder } from '@/types';
import { StorageService } from '@/storage';
import { nowIso, isPastDue, isToday, combineDateAndTime } from '@/utils/date';
import { withActivity } from './activityService';

export interface SetReminderInput {
  enabled: boolean;
  date: string | null;
  time: string | null;
  note: string;
}

export async function setReminder(contactId: string, input: SetReminderInput): Promise<Contact | null> {
  const contact = await StorageService.getContact(contactId);
  if (!contact) return null;

  const reminder: Reminder = {
    enabled: input.enabled,
    date: input.date,
    time: input.time,
    note: input.note,
    completed: false,
    notificationSent: false,
  };

  const description = input.enabled && input.date
    ? `Reminder set for ${input.date}${input.time ? ` at ${input.time}` : ''}.`
    : 'Reminder cleared.';

  const updated = withActivity(
    { ...contact, reminder, updatedAt: nowIso() },
    'reminder_created',
    description
  );
  await StorageService.saveContact(updated);
  return updated;
}

export async function completeReminder(contactId: string): Promise<Contact | null> {
  const contact = await StorageService.getContact(contactId);
  if (!contact) return null;

  const updated = withActivity(
    {
      ...contact,
      reminder: { ...contact.reminder, completed: true, enabled: false },
      updatedAt: nowIso(),
    },
    'reminder_completed',
    'Reminder marked complete.'
  );
  await StorageService.saveContact(updated);
  return updated;
}

/** Pushes a reminder's date/time forward by the given number of days (default: 1). */
export async function snoozeReminder(contactId: string, days = 1): Promise<Contact | null> {
  const contact = await StorageService.getContact(contactId);
  if (!contact || !contact.reminder.date) return null;

  const current = combineDateAndTime(contact.reminder.date, contact.reminder.time ?? '09:00');
  current.setDate(current.getDate() + days);

  const yyyy = current.getFullYear();
  const mm = String(current.getMonth() + 1).padStart(2, '0');
  const dd = String(current.getDate()).padStart(2, '0');
  const newDate = `${yyyy}-${mm}-${dd}`;

  const updated = withActivity(
    {
      ...contact,
      reminder: { ...contact.reminder, date: newDate, notificationSent: false },
      updatedAt: nowIso(),
    },
    'reminder_snoozed',
    `Reminder snoozed to ${newDate}.`
  );
  await StorageService.saveContact(updated);
  return updated;
}

export async function markNotificationSent(contactId: string): Promise<void> {
  const contact = await StorageService.getContact(contactId);
  if (!contact) return;
  await StorageService.saveContact({
    ...contact,
    reminder: { ...contact.reminder, notificationSent: true },
  });
}

function isActiveReminder(contact: Contact): boolean {
  return contact.reminder.enabled && !contact.reminder.completed && !!contact.reminder.date;
}

// Pure, array-in/array-out filters — exported separately from their
// fetch-and-filter convenience wrappers below so callers that already have
// a contacts array in hand (e.g. the popup, which needs all three views at
// once) can derive them in-memory instead of re-reading chrome.storage.local
// once per view.
export function filterDueReminders(contacts: Contact[]): Contact[] {
  return contacts.filter(
    (c) => isActiveReminder(c) && isPastDue(c.reminder.date, c.reminder.time) && !c.reminder.notificationSent
  );
}

export function filterTodayReminders(contacts: Contact[]): Contact[] {
  return contacts.filter((c) => isActiveReminder(c) && isToday(c.reminder.date));
}

export function filterOverdueReminders(contacts: Contact[]): Contact[] {
  return contacts.filter(
    (c) => isActiveReminder(c) && isPastDue(c.reminder.date, c.reminder.time) && !isToday(c.reminder.date)
  );
}

export async function getDueReminders(): Promise<Contact[]> {
  return filterDueReminders(await StorageService.getContacts());
}

export async function getTodayReminders(): Promise<Contact[]> {
  return filterTodayReminders(await StorageService.getContacts());
}

export async function getOverdueReminders(): Promise<Contact[]> {
  return filterOverdueReminders(await StorageService.getContacts());
}
