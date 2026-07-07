import type { Contact } from '@/types';
import { ContactRow } from './ContactRow';
import { openProfileTab } from '../openProfile';
import * as reminderService from '@/services/reminderService';
import { CheckIcon, ClockIcon } from '@/sidebar/components/icons';

interface RemindersSectionProps {
  title: string;
  contacts: Contact[];
  tone: 'today' | 'overdue';
  onChanged: () => void;
}

export function RemindersSection({ title, contacts, tone, onChanged }: RemindersSectionProps) {
  if (contacts.length === 0) return null;

  return (
    <section>
      <div className="mb-1 flex items-center gap-2 px-2">
        <h3 className="lcrm-section-title">{title}</h3>
        <span
          className={
            tone === 'overdue'
              ? 'rounded-full bg-red-100 dark:bg-red-900/40 px-1.5 py-0.5 text-xs font-semibold text-red-700 dark:text-red-300'
              : 'rounded-full bg-amber-100 dark:bg-amber-900/40 px-1.5 py-0.5 text-xs font-semibold text-amber-700 dark:text-amber-300'
          }
        >
          {contacts.length}
        </span>
      </div>
      <div className="space-y-0.5">
        {contacts.map((contact) => (
          <ContactRow
            key={contact.id}
            contact={contact}
            subtitle={contact.reminder.note || 'Follow up'}
            onClick={() => openProfileTab(contact.linkedinUrl)}
            actions={
              <>
                <button
                  type="button"
                  className="lcrm-btn-ghost !px-1.5 !py-1"
                  title="Snooze 1 day"
                  onClick={async () => {
                    await reminderService.snoozeReminder(contact.id, 1);
                    onChanged();
                  }}
                >
                  <ClockIcon />
                </button>
                <button
                  type="button"
                  className="lcrm-btn-ghost !px-1.5 !py-1 text-emerald-600"
                  title="Mark complete"
                  onClick={async () => {
                    await reminderService.completeReminder(contact.id);
                    onChanged();
                  }}
                >
                  <CheckIcon />
                </button>
              </>
            }
          />
        ))}
      </div>
    </section>
  );
}
