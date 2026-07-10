import { create } from 'zustand';

interface UIState {
  /** Whether the injected sidebar panel is expanded or collapsed to a tab. */
  isSidebarOpen: boolean;
  isDarkMode: boolean;

  setSidebarOpen: (open: boolean) => void;
  setDarkMode: (dark: boolean) => void;
}

/**
 * Pure, ephemeral UI state — never persisted to chrome.storage.local.
 * Kept intentionally separate from the data store (contacts/tags/templates)
 * so UI concerns (open/closed, dark mode) never leak into the persistence
 * layer.
 */
export const useUIStore = create<UIState>((set) => ({
  isSidebarOpen: true,
  // Default to light mode; the sidebar's own toggle button flips it per session.
  isDarkMode: false,

  setSidebarOpen: (open) => set({ isSidebarOpen: open }),
  setDarkMode: (dark) => set({ isDarkMode: dark }),
}));
