import { useEffect, useState } from 'react';
import type { Contact } from '@/types';
import { CollapsibleSection } from './CollapsibleSection';
import { FieldLabel } from './FieldLabel';
import { Toggle } from './Toggle';
import { BellIcon, CheckIcon, ClockIcon } from './icons';
import { useContactStore } from '@/store/contactStore';
import { todayDateString, isPastDue, isToday } from '@/utils/date';
import { cn } from '@/utils/classnames';

export function ReminderSection({ contact }: { contact: Contact }) {
  const setReminder = useContactStore((s) => s.setReminder);
  const completeReminder = useContactStore((s) => s.completeReminder);
  const snoozeReminder = useContactStore((s) => s.snoozeReminder);

  const [enabled, setEnabled] = useState(contact.reminder.enabled);
  const [date, setDate] = useState(contact.reminder.date ?? todayDateString());
  const [time, setTime] = useState(contact.reminder.time ?? '09:00');
  const [note, setNote] = useState(contact.reminder.note);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    setEnabled(contact.reminder.enabled);
    setDate(contact.reminder.date ?? todayDateString());
    setTime(contact.reminder.time ?? '09:00');
    setNote(contact.reminder.note);
    setDirty(false);
  }, [contact.id, contact.reminder]);

  const overdue = contact.reminder.enabled && !contact.reminder.completed && isPastDue(contact.reminder.date, contact.reminder.time);
  const dueToday = contact.reminder.enabled && !contact.reminder.completed && isToday(contact.reminder.date);

  function markDirty<T>(setter: (v: T) => void) {
    return (v: T) => {
      setter(v);
      setDirty(true);
    };
  }

  async function handleSave() {
    await setReminder(contact.id, { enabled, date, time, note });
    setDirty(false);
  }

  return (
    <CollapsibleSection
      title="Reminder"
      icon={<BellIcon />}
      badge={
        (overdue || dueToday) && (
          <span
            className={cn(
              'rounded-full px-1.5 py-0.5 text-xs font-semibold',
              overdue
                ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
                : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
            )}
          >
            {overdue ? 'Overdue' : 'Today'}
          </span>
        )
      }
    >
      <div className="flex items-center justify-between">
        <Toggle checked={enabled} onChange={markDirty(setEnabled)} label={enabled ? 'Enabled' : 'Disabled'} />
        {contact.reminder.completed && (
          <span className="flex items-center gap-1 text-sm font-medium text-emerald-600 dark:text-emerald-400">
            <CheckIcon /> Completed
          </span>
        )}
      </div>

      {enabled && (
        <div className="mt-3 space-y-3 animate-fade-in">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <FieldLabel>Date</FieldLabel>
              <input
                type="date"
                className="lcrm-input"
                value={date}
                onChange={(e) => markDirty(setDate)(e.target.value)}
              />
            </div>
            <div>
              <FieldLabel>Time</FieldLabel>
              <input
                type="time"
                className="lcrm-input"
                value={time}
                onChange={(e) => markDirty(setTime)(e.target.value)}
              />
            </div>
          </div>

          <div>
            <FieldLabel>Note</FieldLabel>
            <input
              type="text"
              className="lcrm-input"
              placeholder="What should this reminder be about?"
              value={note}
              onChange={(e) => markDirty(setNote)(e.target.value)}
            />
          </div>
        </div>
      )}

      {/*
        Save is always reachable — including while `enabled` is false —
        otherwise turning a reminder off has no way to actually persist,
        since the fields above (and the button that used to live among
        them) would vanish the instant the toggle flips.
      */}
      <div className="flex flex-wrap items-center gap-2 pt-3">
        <button type="button" className="lcrm-btn-primary" onClick={handleSave} disabled={!dirty}>
          Save Reminder
        </button>
        {contact.reminder.enabled && contact.reminder.date && !contact.reminder.completed && (
          <>
            <button type="button" className="lcrm-btn-secondary" onClick={() => snoozeReminder(contact.id, 1)}>
              <ClockIcon /> Snooze 1 day
            </button>
            <button type="button" className="lcrm-btn-ghost" onClick={() => completeReminder(contact.id)}>
              <CheckIcon /> Mark done
            </button>
          </>
        )}
      </div>
    </CollapsibleSection>
  );
}
