import { useState } from 'react';
import type { Activity, ActivityType, Contact } from '@/types';
import { CollapsibleSection } from './CollapsibleSection';
import {
  ActivityIcon,
  BellIcon,
  CheckIcon,
  ClockIcon,
  NoteIcon,
  PlusIcon,
  TagIcon,
  ZapIcon,
} from './icons';
import { useContactStore } from '@/store/contactStore';
import { formatRelativeTime, formatDateTime } from '@/utils/date';

const ACTIVITY_ICON: Record<ActivityType, JSX.Element> = {
  profile_created: <ZapIcon />,
  status_changed: <ZapIcon />,
  priority_changed: <ZapIcon />,
  temperature_changed: <ZapIcon />,
  tag_added: <TagIcon />,
  tag_removed: <TagIcon />,
  note_updated: <NoteIcon />,
  reminder_created: <BellIcon />,
  reminder_completed: <CheckIcon />,
  reminder_snoozed: <ClockIcon />,
  manual_activity: <ActivityIcon />,
};

function TimelineRow({ activity }: { activity: Activity }) {
  return (
    <li className="flex gap-3 py-2.5">
      <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400">
        {ACTIVITY_ICON[activity.type]}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-base text-neutral-700 dark:text-neutral-200">{activity.description}</p>
        <p className="text-xs text-neutral-400 dark:text-neutral-500" title={formatDateTime(activity.timestamp)}>
          {formatRelativeTime(activity.timestamp)}
        </p>
      </div>
    </li>
  );
}

export function TimelineSection({ contact }: { contact: Contact }) {
  const [note, setNote] = useState('');
  const addManualActivity = useContactStore((s) => s.addManualActivity);

  const sorted = [...contact.activities].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  async function handleAdd() {
    const trimmed = note.trim();
    if (!trimmed) return;
    await addManualActivity(contact.id, trimmed);
    setNote('');
  }

  return (
    <CollapsibleSection title="Timeline" icon={<ActivityIcon />} defaultOpen={false}>
      <div className="mb-2 flex items-center gap-2">
        <input
          type="text"
          className="lcrm-input"
          placeholder="Log a manual activity…"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
        />
        <button type="button" className="lcrm-btn-secondary shrink-0" onClick={handleAdd}>
          <PlusIcon />
        </button>
      </div>

      <ul className="lcrm-scrollbar max-h-72 divide-y divide-neutral-100 dark:divide-neutral-800 overflow-y-auto">
        {sorted.map((activity) => (
          <TimelineRow key={activity.id} activity={activity} />
        ))}
        {sorted.length === 0 && (
          <p className="py-4 text-center text-sm text-neutral-400 dark:text-neutral-500">No activity yet.</p>
        )}
      </ul>
    </CollapsibleSection>
  );
}
