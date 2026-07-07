import { useCallback, useEffect, useState } from 'react';
import type { Contact } from '@/types';
import { StorageService } from '@/storage';
import { filterTodayReminders, filterOverdueReminders } from '@/services/reminderService';
import { useAppliedTheme } from '@/hooks/useAppliedTheme';
import { PopupHeader } from './components/PopupHeader';
import { RemindersSection } from './components/RemindersSection';
import { RecentContacts } from './components/RecentContacts';
import { QuickSearch } from './components/QuickSearch';
import { SettingsPanel } from './components/SettingsPanel';

export function PopupApp() {
  useAppliedTheme();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [todayReminders, setTodayReminders] = useState<Contact[]>([]);
  const [overdueReminders, setOverdueReminders] = useState<Contact[]>([]);
  const [showSettings, setShowSettings] = useState(false);

  const refresh = useCallback(async () => {
    // Single read of the contacts record — today's/overdue reminders are
    // derived from it in-memory rather than each re-fetching separately.
    const all = await StorageService.getContacts();
    setContacts(all);
    setTodayReminders(filterTodayReminders(all));
    setOverdueReminders(filterOverdueReminders(all));
  }, []);

  useEffect(() => {
    refresh();
    const unsubscribe = StorageService.onChange(refresh);
    return unsubscribe;
  }, [refresh]);

  return (
    <div className="w-[420px] max-h-[600px] overflow-y-auto lcrm-scrollbar bg-neutral-50 dark:bg-neutral-950 p-3 font-sans">
      <PopupHeader />

      {showSettings ? (
        <SettingsPanel onClose={() => setShowSettings(false)} />
      ) : (
        <div className="space-y-4">
          <RemindersSection title="Overdue Reminders" contacts={overdueReminders} tone="overdue" onChanged={refresh} />
          <RemindersSection title="Today's Reminders" contacts={todayReminders} tone="today" onChanged={refresh} />
          <QuickSearch contacts={contacts} />
          <RecentContacts contacts={contacts} />

          <button
            type="button"
            className="lcrm-btn-secondary w-full"
            onClick={() => setShowSettings(true)}
          >
            Settings
          </button>
        </div>
      )}
    </div>
  );
}
