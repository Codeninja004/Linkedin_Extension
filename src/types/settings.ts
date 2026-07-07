export type ThemePreference = 'light' | 'dark' | 'system';

export interface Settings {
  theme: ThemePreference;
  sidebarCollapsedByDefault: boolean;
  reminderCheckIntervalMinutes: number;
  notificationsEnabled: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
  theme: 'system',
  sidebarCollapsedByDefault: false,
  reminderCheckIntervalMinutes: 5,
  notificationsEnabled: true,
};
