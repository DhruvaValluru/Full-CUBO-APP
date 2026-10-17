import type { AppColors } from './colors';
/** Auth uses the same surfaces/actions as the signed-in app, with a quiet green top wash. */
export function authTheme(colors: AppColors, mode: 'light' | 'dark') {
  return {
    ...colors,
    gradient: [mode === 'dark' ? '#203B34' : '#D6EBDF', colors.background, colors.background] as const,
    fieldBorder: mode === 'dark' ? '#647487' : '#809387',
    errorText: mode === 'dark' ? '#FF9B95' : '#AF3029',
  };
}
