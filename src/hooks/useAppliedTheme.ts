import { useEffect } from 'react';
import { StorageService } from '@/storage';
import type { ThemePreference } from '@/types';

/**
 * Applies the user's theme preference (from Settings) to <html class="dark">
 * for full-page contexts (popup, dashboard) where Tailwind's `dark:` variant
 * needs a real ancestor class. The injected sidebar handles this separately
 * (see sidebar/hooks/useDarkMode.ts) since it lives inside a Shadow DOM.
 */
export function useAppliedTheme(): void {
  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    // Default to light until the stored preference resolves, so first paint
    // is never a dark flash on machines whose OS is set to dark mode.
    let currentTheme: ThemePreference = 'light';

    const apply = () => {
      const isDark = currentTheme === 'dark' || (currentTheme === 'system' && media.matches);
      document.documentElement.classList.toggle('dark', isDark);
    };

    StorageService.getSettings().then((settings) => {
      currentTheme = settings.theme;
      apply();
    });

    const mediaListener = () => apply();
    media.addEventListener('change', mediaListener);

    const unsubscribeStorage = StorageService.onChange(() => {
      StorageService.getSettings().then((settings) => {
        currentTheme = settings.theme;
        apply();
      });
    });

    return () => {
      media.removeEventListener('change', mediaListener);
      unsubscribeStorage();
    };
  }, []);
}
