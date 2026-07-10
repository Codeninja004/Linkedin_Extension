import { useMemo } from 'react';
import type { Contact } from '@/types';
import * as reminderService from '@/services/reminderService';
import { isToday, isPastDue } from '@/utils/date';
import { BellIcon, CheckIcon, ClockIcon, XIcon, ExternalLinkIcon } from '@/sidebar/components/icons';

interface NotificationsPanelProps {
  contacts: Contact[];
  onOpenLead: (contact: Contact) => void;
  onChanged: () => void;
  onClose: () => void;
}

function isActive(c: Contact): boolean {
  return c.reminder.enabled && !c.reminder.completed && !!c.reminder.date;
}

function ReminderItem({
  contact,
  tone,
  onOpenLead,
  onChanged,
}: {
  contact: Contact;
  tone: 'overdue' | 'today' | 'upcoming';
  onOpenLead: (c: Contact) => void;
  onChanged: () => void;
}) {
  const dueLabel = `${contact.reminder.date ?? ''}${contact.reminder.time ? ` · ${contact.reminder.time}` : ''}`;
  const toneDot =
    tone === 'overdue' ? 'bg-error dark:bg-error-dark' : tone === 'today' ? 'bg-warning dark:bg-warning-dark' : 'bg-brand-500';

  return (
    <div className="flex items-start gap-3 rounded-lg border border-neutral-200 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-900">
      <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${toneDot}`} aria-hidden />
      {contact.photo ? (
        <img src={contact.photo} alt="" className="h-9 w-9 shrink-0 rounded-full object-cover" />
      ) : (
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700 dark:bg-brand-900 dark:text-brand-300">
          {(contact.name || '?').slice(0, 1)}
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-base font-medium text-neutral-800 dark:text-neutral-100">{contact.name || 'Unknown'}</p>
        <p className="truncate text-sm text-neutral-500 dark:text-neutral-400">
          {contact.reminder.note || 'Follow up'}
          {contact.company ? ` · ${contact.company}` : ''}
        </p>
        <p className="mt-0.5 text-xs text-neutral-400">{dueLabel}</p>
      </div>
      <div className="flex shrink-0 items-center gap-0.5">
        <button
          type="button"
          className="lcrm-btn-ghost !p-1.5 text-neutral-400 hover:text-brand-600 dark:hover:text-brand-400"
          title="Open lead details"
          onClick={() => onOpenLead(contact)}
          aria-label={`Open ${contact.name} details`}
        >
          <ExternalLinkIcon />
        </button>
        <button
          type="button"
          className="lcrm-btn-ghost !p-1.5"
          title="Snooze 1 day"
          onClick={async () => {
            await reminderService.snoozeReminder(contact.id, 1);
            onChanged();
          }}
          aria-label={`Snooze reminder for ${contact.name}`}
        >
          <ClockIcon />
        </button>
        <button
          type="button"
          className="lcrm-btn-ghost !p-1.5 text-success dark:text-success-dark"
          title="Mark complete"
          onClick={async () => {
            await reminderService.completeReminder(contact.id);
            onChanged();
          }}
          aria-label={`Complete reminder for ${contact.name}`}
        >
          <CheckIcon />
        </button>
      </div>
    </div>
  );
}

export function NotificationsPanel({ contacts, onOpenLead, onChanged, onClose }: NotificationsPanelProps) {
  const { overdue, today, upcoming } = useMemo(() => {
    return {
      overdue: reminderService.filterOverdueReminders(contacts),
      today: reminderService.filterTodayReminders(contacts),
      upcoming: contacts.filter(
        (c) => isActive(c) && !isToday(c.reminder.date) && !isPastDue(c.reminder.date, c.reminder.time)
      ),
    };
  }, [contacts]);

  const total = overdue.length + today.length + upcoming.length;

  const groups: { key: string; title: string; tone: 'overdue' | 'today' | 'upcoming'; items: Contact[] }[] = [
    { key: 'overdue', title: 'Overdue', tone: 'overdue', items: overdue },
    { key: 'today', title: 'Today', tone: 'today', items: today },
    { key: 'upcoming', title: 'Upcoming', tone: 'upcoming', items: upcoming },
  ];

  return (
    <div className="lcrm-card animate-fade-in flex max-h-[70vh] flex-col overflow-hidden p-0">
      <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-3 dark:border-neutral-800">
        <h3 className="flex items-center gap-2 text-base font-semibold text-neutral-800 dark:text-neutral-100">
          <BellIcon className="text-brand-600 dark:text-brand-400" />
          Notifications
          {total > 0 && (
            <span className="rounded-full bg-brand-600 px-1.5 py-0.5 text-xs font-semibold text-white dark:bg-brand-400 dark:text-neutral-950">
              {total}
            </span>
          )}
        </h3>
        <button type="button" className="lcrm-btn-ghost !p-1" onClick={onClose} aria-label="Close notifications">
          <XIcon />
        </button>
      </div>

      <div className="lcrm-scrollbar flex-1 space-y-4 overflow-y-auto p-4">
        {total === 0 && (
          <div className="py-8 text-center text-sm text-neutral-400 dark:text-neutral-500">
            You're all caught up — no reminders or follow-ups due.
          </div>
        )}

        {groups
          .filter((g) => g.items.length > 0)
          .map((group) => (
            <section key={group.key}>
              <h4 className="mb-1.5 flex items-center gap-2 px-0.5 text-sm font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                {group.title}
                <span className="text-xs font-normal text-neutral-400">{group.items.length}</span>
              </h4>
              <div className="space-y-1.5">
                {group.items.map((contact) => (
                  <ReminderItem
                    key={contact.id}
                    contact={contact}
                    tone={group.tone}
                    onOpenLead={onOpenLead}
                    onChanged={onChanged}
                  />
                ))}
              </div>
            </section>
          ))}
      </div>
    </div>
  );
}
