import type { Contact } from '@/types';
import { CollapsibleSection } from './CollapsibleSection';
import { NoteIcon } from './icons';
import { useNoteAutosave } from '../hooks/useNoteAutosave';
import { formatRelativeTime } from '@/utils/date';

export function NotesSection({ contact }: { contact: Contact }) {
  const { content, onChange, status } = useNoteAutosave(contact.id, contact.note.content);

  return (
    <CollapsibleSection title="Notes" icon={<NoteIcon />}>
      <textarea
        className="lcrm-input min-h-[120px] resize-y font-sans leading-relaxed"
        placeholder="Write anything about this contact — context, what matters to them, next steps…"
        value={content}
        onChange={(e) => onChange(e.target.value)}
      />
      <div className="mt-1.5 flex items-center justify-between text-xs text-neutral-400 dark:text-neutral-500">
        <span>
          {status === 'saving' && 'Saving…'}
          {status === 'saved' && 'Saved'}
          {status === 'idle' && contact.note.lastEdited && `Last edited ${formatRelativeTime(contact.note.lastEdited)}`}
        </span>
        <span>{content.length} chars</span>
      </div>
    </CollapsibleSection>
  );
}
