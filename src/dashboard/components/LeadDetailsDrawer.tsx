import { useEffect } from 'react';
import { useContactStore } from '@/store/contactStore';
import { ProfilePage } from '@/sidebar/pages/ProfilePage';
import { ExternalLinkIcon, XIcon } from '@/sidebar/components/icons';

/**
 * A right-hand slide-over that shows a lead's full CRM details in-page
 * (instead of navigating away). It reuses the exact same section components
 * as the injected LinkedIn sidebar by feeding them the dashboard's
 * contactStore/tagTemplateStore — so pipeline, lists, tags, notes, reminder
 * and timeline are all fully editable here, and every edit persists straight
 * to storage (which refreshes the table underneath via StorageService.onChange).
 */
export function LeadDetailsDrawer() {
  const contact = useContactStore((s) => s.activeContact());
  const clearActiveContact = useContactStore((s) => s.clearActiveContact);

  useEffect(() => {
    if (!contact) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') clearActiveContact();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [contact, clearActiveContact]);

  if (!contact) return null;

  return (
    <div className="fixed inset-0 z-40 flex justify-end font-geist" role="dialog" aria-modal="true" aria-label="Lead details">
      <div className="flex-1 bg-black/20 animate-fade-in" onClick={clearActiveContact} aria-hidden />

      <aside className="lcrm-scrollbar flex h-full w-full max-w-[440px] flex-col overflow-y-auto border-l border-neutral-200 bg-neutral-50 shadow-panel animate-slide-in dark:border-neutral-800 dark:bg-neutral-950">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-neutral-200 bg-neutral-50/90 px-4 py-3 backdrop-blur dark:border-neutral-800 dark:bg-neutral-950/90">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
            Lead details
          </h2>
          <div className="flex items-center gap-1">
            <button
              type="button"
              className="lcrm-btn-ghost !p-1.5 text-neutral-500 hover:text-brand-600 dark:hover:text-brand-400"
              onClick={() => chrome.tabs.create({ url: contact.linkedinUrl })}
              aria-label="Open LinkedIn profile"
              title="Open LinkedIn profile"
            >
              <ExternalLinkIcon />
            </button>
            <button
              type="button"
              className="lcrm-btn-ghost !p-1.5"
              onClick={clearActiveContact}
              aria-label="Close lead details"
            >
              <XIcon />
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-3 p-3">
          <ProfilePage contact={contact} />
        </div>
      </aside>
    </div>
  );
}
