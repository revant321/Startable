import { useEffect } from 'react';
import { useSettings } from './useSettings';

export type ThemeMode = 'system' | 'light' | 'dark';

export function applyThemeClass(theme: ThemeMode) {
  const html = document.documentElement;
  html.classList.remove('light', 'dark');
  if (theme === 'light') html.classList.add('light');
  if (theme === 'dark') html.classList.add('dark');
}

export function useTheme(): ThemeMode {
  const settings = useSettings();
  const theme = settings.theme;

  useEffect(() => {
    applyThemeClass(theme);
  }, [theme]);

  return theme;
}
