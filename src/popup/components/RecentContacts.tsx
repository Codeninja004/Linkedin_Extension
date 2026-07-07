import type { Contact } from '@/types';
import { ContactRow } from './ContactRow';
import { openProfileTab } from '../openProfile';
import { formatRelativeTime } from '@/utils/date';

export function RecentContacts({ contacts }: { contacts: Contact[] }) {
  const recent = [...contacts]
    .sort((a, b) => new Date(b.lastViewed).getTime() - new Date(a.lastViewed).getTime())
    .slice(0, 5);

  return (
    <section>
      <h3 className="lcrm-section-title mb-1 px-2">Recent Contacts</h3>
      {recent.length === 0 ? (
        <p className="px-2 text-sm text-neutral-400">No contacts yet — visit a LinkedIn profile to get started.</p>
      ) : (
        <div className="space-y-0.5">
          {recent.map((contact) => (
            <ContactRow
              key={contact.id}
              contact={contact}
              subtitle={`Viewed ${formatRelativeTime(contact.lastViewed)}`}
              onClick={() => openProfileTab(contact.linkedinUrl)}
            />
          ))}
        </div>
      )}
    </section>
  );
}
