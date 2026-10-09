/** Reference UI: black background, #1C1C1E cards, lime / green accents */
export const darkColors = {
  background: '#0B0D12',
  card: '#151820',
  cardHover: '#1D222D',
  cardElevated: '#1B1F29',
  border: 'rgba(255, 255, 255, 0.08)',
  borderLight: 'rgba(255, 255, 255, 0.10)',
  borderStrong: 'rgba(255, 255, 255, 0.15)',

  text: '#FFFFFF',
  textSecondary: '#A8AFBD',
  textMuted: '#A8AFBD',
  textTertiary: '#707989',
  accent: '#FF7A59',
  accentSecondary: '#FFB15C',
  accentSoft: 'rgba(255, 122, 89, 0.16)',
  onAccent: '#180B08',
  mapSurface: '#202532',

  /** Semicircle / ring — stark green on dark track */
  gaugeProgress: '#00FF88',
  gaugeTrack: '#3A3A3C',

  /** Stark green accents (replaces former yellow / lime) */
  starkGreen: '#00FF88',
  accentLime: '#00FF88',
  accentLimeMuted: 'rgba(0, 255, 136, 0.55)',
  accentGreen: '#00E676',
  mustard: '#00CC6A',

  star: '#00FF88',
  danger: '#FF453A',
  dangerMuted: '#C62828',
  amber: '#FFB020',
  amberSoft: 'rgba(255, 176, 32, 0.14)',
  blue: '#58A6FF',
  blueSoft: 'rgba(88, 166, 255, 0.14)',

  successGreen: '#34C759',

  splashBg: '#000000',
  splashText: '#FFFFFF',
  logoGreen: '#00FF88',
  logoGreenMuted: 'rgba(0, 255, 136, 0.55)',

  pageBg: '#0D0D0D',

  surface: '#1C1C1E',
  surfaceMuted: '#2C2C2E',
  primary: '#00FF88',
  primaryStrong: '#00E676',
  primarySoft: 'rgba(0, 255, 136, 0.14)',
  success: '#56C24D',
  successSoft: 'rgba(86, 194, 77, 0.15)',
  warning: '#00CC6A',
  warningSoft: 'rgba(0, 255, 136, 0.18)',
  dangerSoft: 'rgba(255, 69, 58, 0.2)',
  white08: 'rgba(255, 255, 255, 0.08)',
  white20: 'rgba(255, 255, 255, 0.2)',
  black06: 'rgba(255, 255, 255, 0.06)',
  shadow: 'rgba(0, 0, 0, 0.4)',
};

export const lightColors: typeof darkColors = {
  ...darkColors,
  background: '#F3F6FC', card: '#FFFFFF', cardHover: '#EAF0FA', cardElevated: '#FFFFFF',
  border: 'rgba(20, 38, 72, 0.09)', borderLight: 'rgba(20, 38, 72, 0.06)', borderStrong: 'rgba(20, 38, 72, 0.15)',
  text: '#111A2D', textSecondary: '#657089', textMuted: '#657089', textTertiary: '#929CB0',
  accent: '#315BFF', accentSecondary: '#69A5FF', accentSoft: 'rgba(49, 91, 255, 0.11)', onAccent: '#FFFFFF', mapSurface: '#DFE9FA',
  gaugeTrack: '#DCE3F0', pageBg: '#F3F6FC', surface: '#FFFFFF', surfaceMuted: '#E8EEF8',
  primarySoft: 'rgba(0, 170, 92, 0.10)', successSoft: 'rgba(45, 150, 75, 0.12)',
  white08: 'rgba(20, 20, 18, 0.06)', white20: 'rgba(20, 20, 18, 0.14)', black06: 'rgba(20, 20, 18, 0.05)',
  shadow: 'rgba(20, 20, 18, 0.12)', blueSoft: 'rgba(35, 105, 190, 0.10)', amberSoft: 'rgba(190, 120, 0, 0.10)',
};

export type AppColors = typeof darkColors;
export const colors = darkColors;
