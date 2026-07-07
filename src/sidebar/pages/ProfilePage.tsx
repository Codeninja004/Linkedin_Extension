import type { Contact } from '@/types';
import { ContactHeader } from '../components/ContactHeader';
import { PipelineSection } from '../components/PipelineSection';
import { TagsSection } from '../components/TagsSection';
import { NotesSection } from '../components/NotesSection';
import { ReminderSection } from '../components/ReminderSection';
import { TimelineSection } from '../components/TimelineSection';
import { TemplatesSection } from '../components/TemplatesSection';

/** The full contact workspace shown once a profile has been detected. */
export function ProfilePage({ contact }: { contact: Contact }) {
  return (
    <>
      <ContactHeader profile={contact} />
      <PipelineSection contact={contact} />
      <TagsSection contact={contact} />
      <NotesSection contact={contact} />
      <ReminderSection contact={contact} />
      <TimelineSection contact={contact} />
      <TemplatesSection contact={contact} />
    </>
  );
}
