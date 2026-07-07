import { useEffect, useState } from 'react';
import type { Settings, ThemePreference } from '@/types';
import { StorageService } from '@/storage';
import { Toggle } from '@/sidebar/components/Toggle';
import { FieldLabel } from '@/sidebar/components/FieldLabel';
import { XIcon } from '@/sidebar/components/icons';

export function SettingsPanel({ onClose }: { onClose: () => void }) {
  const [settings, setSettings] = useState<Settings | null>(null);

  useEffect(() => {
    StorageService.getSettings().then(setSettings);
  }, []);

  async function persist(next: Settings) {
    setSettings(next);
    await StorageService.saveSettings(next);
  }

  if (!settings) return null;

  return (
    <div className="lcrm-card animate-fade-in p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-base font-semibold text-neutral-800 dark:text-neutral-100">Settings</h3>
        <button type="button" className="lcrm-btn-ghost !p-1" onClick={onClose} aria-label="Close settings">
          <XIcon />
        </button>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-base text-neutral-700 dark:text-neutral-200">Reminder notifications</span>
          <Toggle
            checked={settings.notificationsEnabled}
            onChange={(checked) => persist({ ...settings, notificationsEnabled: checked })}
          />
        </div>

        <div>
          <FieldLabel>Theme</FieldLabel>
          <select
            className="lcrm-select"
            value={settings.theme}
            onChange={(e) => persist({ ...settings, theme: e.target.value as ThemePreference })}
          >
            <option value="system">Match system</option>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </div>

        <div>
          <FieldLabel>Reminder check interval (minutes)</FieldLabel>
          <input
            type="number"
            min={1}
            max={60}
            className="lcrm-input"
            value={settings.reminderCheckIntervalMinutes}
            onChange={(e) =>
              persist({ ...settings, reminderCheckIntervalMinutes: Number(e.target.value) || 5 })
            }
          />
        </div>
      </div>
    </div>
  );
}
