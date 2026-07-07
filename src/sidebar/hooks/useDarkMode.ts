import { useEffect } from 'react';
import { useUIStore } from '@/store/uiStore';

/** Keeps UI store's dark mode flag in sync with the OS-level color scheme preference. */
export function useDarkMode() {
  const isDarkMode = useUIStore((s) => s.isDarkMode);
  const setDarkMode = useUIStore((s) => s.setDarkMode);

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const listener = (e: MediaQueryListEvent) => setDarkMode(e.matches);
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, [setDarkMode]);

  return isDarkMode;
}
