import type { Contact, Tag } from '@/types';
import { PIPELINE_STAGE_LABELS, PRIORITY_LABELS } from '@/types/contact';
import type { SortDir, SortKey } from '../hooks/useContactsFilter';
import { Chip } from '@/sidebar/components/Chip';
import { ChevronDownIcon, TrashIcon, ExternalLinkIcon } from '@/sidebar/components/icons';
import { formatRelativeTime } from '@/utils/date';
import { cn } from '@/utils/classnames';

interface ContactsTableProps {
  contacts: Contact[];
  tags: Tag[];
  sortKey: SortKey;
  sortDir: SortDir;
  onSort: (key: SortKey) => void;
  onOpenProfile: (url: string) => void;
  onView: (contact: Contact) => void;
  onDelete: (id: string) => void;
}

const PRIORITY_STYLE: Record<Contact['priority'], string> = {
  low: 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300',
  medium: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  high: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
};

const STAGE_STYLE: Record<Contact['stage'], string> = {
  lead: 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300',
  connection_sent: 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300',
  connected: 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300',
  conversation_started: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300',
  interested: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300',
  meeting_scheduled: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
  proposal_sent: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
  customer: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  closed_lost: 'bg-neutral-200 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-500',
};

function ReminderCell({ contact }: { contact: Contact }) {
  if (!contact.reminder.enabled || !contact.reminder.date) {
    return <span className="text-sm text-neutral-300 dark:text-neutral-600">—</span>;
  }
  if (contact.reminder.completed) {
    return <span className="text-sm text-emerald-600 dark:text-emerald-400">Done</span>;
  }
  return (
    <span className="text-sm text-neutral-500 dark:text-neutral-400">
      {contact.reminder.date} {contact.reminder.time ?? ''}
    </span>
  );
}

function SortableHeader({
  label,
  sortKeyValue,
  activeKey,
  dir,
  onSort,
}: {
  label: string;
  sortKeyValue: SortKey;
  activeKey: SortKey;
  dir: SortDir;
  onSort: (key: SortKey) => void;
}) {
  const active = sortKeyValue === activeKey;
  return (
    <th className="px-3 py-2 text-left">
      <button
        type="button"
        onClick={() => onSort(sortKeyValue)}
        className="flex items-center gap-1 rounded text-sm font-semibold uppercase tracking-wide text-neutral-500 hover:text-neutral-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/50 dark:text-neutral-400 dark:hover:text-neutral-200"
      >
        {label}
        <ChevronDownIcon
          className={cn('h-3 w-3 transition-transform', active ? 'opacity-100' : 'opacity-0', active && dir === 'desc' && 'rotate-180')}
        />
      </button>
    </th>
  );
}

export function ContactsTable({
  contacts,
  tags,
  sortKey,
  sortDir,
  onSort,
  onOpenProfile,
  onView,
  onDelete,
}: ContactsTableProps) {
  const tagById = new Map(tags.map((t) => [t.id, t]));

  return (
    <div className="lcrm-card overflow-x-auto">
      <table className="w-full min-w-[860px] border-collapse text-base">
        <thead className="border-b border-neutral-200 dark:border-neutral-800">
          <tr>
            <SortableHeader label="Name" sortKeyValue="name" activeKey={sortKey} dir={sortDir} onSort={onSort} />
            <SortableHeader label="Company" sortKeyValue="company" activeKey={sortKey} dir={sortDir} onSort={onSort} />
            <SortableHeader label="Stage" sortKeyValue="stage" activeKey={sortKey} dir={sortDir} onSort={onSort} />
            <SortableHeader label="Priority" sortKeyValue="priority" activeKey={sortKey} dir={sortDir} onSort={onSort} />
            <th className="px-3 py-2 text-left text-sm font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
              Reminder
            </th>
            <th className="px-3 py-2 text-left text-sm font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
              Tags
            </th>
            <SortableHeader label="Last Viewed" sortKeyValue="lastViewed" activeKey={sortKey} dir={sortDir} onSort={onSort} />
            <th className="px-3 py-2" />
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
          {contacts.map((contact) => (
            <tr
              key={contact.id}
              tabIndex={0}
              className="cursor-pointer outline-none hover:bg-neutral-50 focus-visible:bg-neutral-50 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-500/50 dark:hover:bg-neutral-800/50 dark:focus-visible:bg-neutral-800/50"
              onClick={() => onView(contact)}
              onKeyDown={(e) => {
                if (e.target !== e.currentTarget) return;
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onView(contact);
                }
              }}
            >
              <td className="px-3 py-2.5">
                <div className="flex items-center gap-2">
                  {contact.photo ? (
                    <img src={contact.photo} alt="" className="h-7 w-7 rounded-full object-cover" />
                  ) : (
                    <div className="h-7 w-7 rounded-full bg-brand-100 dark:bg-brand-900" />
                  )}
                  <span className="font-medium text-neutral-800 dark:text-neutral-100">{contact.name || 'Unknown'}</span>
                </div>
              </td>
              <td className="px-3 py-2.5 text-neutral-600 dark:text-neutral-300">{contact.company || '—'}</td>
              <td className="px-3 py-2.5">
                <span className={cn('rounded-full px-2 py-0.5 text-sm font-medium', STAGE_STYLE[contact.stage])}>
                  {PIPELINE_STAGE_LABELS[contact.stage]}
                </span>
              </td>
              <td className="px-3 py-2.5">
                <span className={cn('rounded-full px-2 py-0.5 text-sm font-medium', PRIORITY_STYLE[contact.priority])}>
                  {PRIORITY_LABELS[contact.priority]}
                </span>
              </td>
              <td className="px-3 py-2.5">
                <ReminderCell contact={contact} />
              </td>
              <td className="px-3 py-2.5">
                <div className="flex flex-wrap gap-1">
                  {contact.tagIds.slice(0, 3).map((id) => {
                    const tag = tagById.get(id);
                    return tag ? <Chip key={id} label={tag.name} color={tag.color} /> : null;
                  })}
                  {contact.tagIds.length > 3 && (
                    <span className="text-xs text-neutral-400">+{contact.tagIds.length - 3}</span>
                  )}
                </div>
              </td>
              <td className="px-3 py-2.5 text-neutral-500 dark:text-neutral-400">
                {formatRelativeTime(contact.lastViewed)}
              </td>
              <td className="px-3 py-2.5">
                <div className="flex items-center justify-end gap-1">
                  <button
                    type="button"
                    className="lcrm-btn-ghost !p-1.5 text-neutral-400 hover:text-brand-600 dark:hover:text-brand-400"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenProfile(contact.linkedinUrl);
                    }}
                    aria-label={`Open ${contact.name || 'this contact'}'s LinkedIn profile`}
                    title="Open LinkedIn profile"
                  >
                    <ExternalLinkIcon />
                  </button>
                  <button
                    type="button"
                    className="lcrm-btn-ghost !p-1.5 text-red-500"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(`Delete ${contact.name || 'this contact'}? This cannot be undone.`)) {
                        onDelete(contact.id);
                      }
                    }}
                    aria-label={`Delete ${contact.name}`}
                  >
                    <TrashIcon />
                  </button>
                </div>
              </td>
            </tr>
          ))}

          {contacts.length === 0 && (
            <tr>
              <td colSpan={8} className="px-3 py-10 text-center text-sm text-neutral-400">
                No contacts match the current filters.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
