import { useEffect, useMemo, useRef, useState } from 'react';
import { useContactStore } from '@/store/contactStore';
import { debounce } from '@/utils/debounce';

const AUTOSAVE_DELAY_MS = 700;

/**
 * Drives the Notes textarea: keeps typing instant (local state + optimistic
 * store update) while persisting to chrome.storage.local only after the
 * user pauses, so we never write on every keystroke.
 *
 * The debounced write always carries the contact id it was scheduled for
 * (rather than reading "whichever contact is active now" when it finally
 * fires), and any pending write is flushed immediately when the user
 * switches profiles — so a fast profile switch mid-debounce can never
 * write one contact's note onto another's record.
 */
export function useNoteAutosave(contactId: string, initialContent: string) {
  const [content, setContent] = useState(initialContent);
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const updateNoteLocal = useContactStore((s) => s.updateNoteLocal);
  const persistNote = useContactStore((s) => s.persistNote);
  const lastContactId = useRef(contactId);

  const debouncedPersist = useMemo(
    () =>
      debounce((id: string, value: string) => {
        setStatus('saving');
        persistNote(id, value).then(() => setStatus('saved'));
      }, AUTOSAVE_DELAY_MS),
    [persistNote]
  );

  // Reset local editor state when the user navigates to a different
  // profile, flushing any not-yet-saved edit for the profile being left.
  useEffect(() => {
    if (lastContactId.current !== contactId) {
      debouncedPersist.flush();
      lastContactId.current = contactId;
      setContent(initialContent);
      setStatus('idle');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contactId]);

  useEffect(() => () => debouncedPersist.cancel(), [debouncedPersist]);

  function onChange(value: string) {
    setContent(value);
    updateNoteLocal(contactId, value);
    debouncedPersist(contactId, value);
  }

  return { content, onChange, status };
}
