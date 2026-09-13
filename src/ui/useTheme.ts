import { useEffect } from 'react';
import { settingsStore } from '../core/settings/store';

/**
 * Applies the user's theme choice to the document root. `system` removes the
 * attribute so the `prefers-color-scheme` block in tokens.css takes over.
 */
export function useTheme(): void {
  useEffect(() => {
    const apply = (theme: 'system' | 'light' | 'dark') => {
      if (theme === 'system') document.documentElement.removeAttribute('data-theme');
      else document.documentElement.setAttribute('data-theme', theme);
    };
    void settingsStore.get().then((s) => apply(s.theme));
    return settingsStore.watch((s) => apply(s.theme));
  }, []);
}
