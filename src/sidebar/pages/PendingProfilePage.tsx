import { useState } from 'react';
import type { LinkedInProfileData } from '@/types';
import { useContactStore } from '@/store/contactStore';
import { ContactHeader } from '../components/ContactHeader';
import { PlusIcon } from '../components/icons';

/**
 * Shown when a profile has been detected but isn't on the list yet. Nothing
 * is written to chrome.storage.local until the user explicitly clicks "Add
 * Profile to List" — this is the one deliberate manual step in an otherwise
 * automatic extension, so a quick look at someone's profile never silently
 * adds them to your CRM.
 */
export function PendingProfilePage({ profile }: { profile: LinkedInProfileData }) {
  const addPendingProfileToList = useContactStore((s) => s.addPendingProfileToList);
  const [isAdding, setIsAdding] = useState(false);

  async function handleAdd() {
    setIsAdding(true);
    try {
      await addPendingProfileToList();
    } finally {
      setIsAdding(false);
    }
  }

  return (
    <>
      <ContactHeader profile={profile} />
      <div className="lcrm-card shrink-0 p-4 text-center">
        <p className="text-base text-neutral-500 dark:text-neutral-400">
          This profile isn't on your list yet.
        </p>
        <button type="button" className="lcrm-btn-primary mx-auto mt-3 w-full" onClick={handleAdd} disabled={isAdding}>
          <PlusIcon />
          {isAdding ? 'Adding…' : 'Add Profile to List'}
        </button>
      </div>
    </>
  );
}
