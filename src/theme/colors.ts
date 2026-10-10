/** Reference UI: black background, #1C1C1E cards, lime / green accents */
export const darkColors = {
  background: '#141414',
  card: '#1E1E1E',
  cardHover: '#292929',
  cardElevated: '#252525',
  border: 'rgba(255, 255, 255, 0.08)',
  borderLight: 'rgba(255, 255, 255, 0.10)',
  borderStrong: 'rgba(255, 255, 255, 0.15)',

  text: '#FFFFFF',
  textSecondary: '#B3C0B8',
  textMuted: '#B3C0B8',
  textTertiary: '#97A69D',
  accent: '#72B99A',
  accentSecondary: '#92C9AF',
  accentSoft: 'rgba(114, 185, 154, 0.14)',
  onAccent: '#10271D',
  mapSurface: '#242424',

  /** Semicircle / ring — stark green on dark track */
  gaugeProgress: '#72B99A',
  gaugeTrack: '#3A3A3C',

  /** Stark green accents (replaces former yellow / lime) */
  starkGreen: '#72B99A',
  accentLime: '#72B99A',
  accentLimeMuted: 'rgba(114, 185, 154, 0.55)',
  accentGreen: '#72B99A',
  mustard: '#D5B168',

  star: '#72B99A',
  danger: '#FF453A',
  dangerMuted: '#C62828',
  amber: '#FFB020',
  amberSoft: 'rgba(255, 176, 32, 0.14)',
  blue: '#58A6FF',
  blueSoft: 'rgba(88, 166, 255, 0.14)',

  successGreen: '#34C759',

  splashBg: '#000000',
  splashText: '#FFFFFF',
  logoGreen: '#72B99A',
  logoGreenMuted: 'rgba(114, 185, 154, 0.55)',

  pageBg: '#111111',

  surface: '#1E1E1E',
  surfaceMuted: '#2C2C2C',
  primary: '#72B99A',
  primaryStrong: '#92C9AF',
  primarySoft: 'rgba(114, 185, 154, 0.14)',
  success: '#56C24D',
  successSoft: 'rgba(86, 194, 77, 0.15)',
  warning: '#D5B168',
  warningSoft: 'rgba(213, 177, 104, 0.15)',
  dangerSoft: 'rgba(255, 69, 58, 0.2)',
  white08: 'rgba(255, 255, 255, 0.08)',
  white20: 'rgba(255, 255, 255, 0.2)',
  black06: 'rgba(255, 255, 255, 0.06)',
  shadow: 'rgba(0, 0, 0, 0.4)',
};

export const lightColors: typeof darkColors = {
  ...darkColors,
  background: '#EDEFEF', card: '#FFFFFF', cardHover: '#E2E8E5', cardElevated: '#FFFFFF',
  border: 'rgba(25, 48, 39, 0.10)', borderLight: 'rgba(25, 48, 39, 0.06)', borderStrong: 'rgba(25, 48, 39, 0.18)',
  text: '#14231D', textSecondary: '#5E6D66', textMuted: '#5E6D66', textTertiary: '#87938D',
  accent: '#176B4D', accentSecondary: '#2F8F68', accentSoft: 'rgba(23, 107, 77, 0.11)', onAccent: '#FFFFFF', mapSurface: '#E4ECE7',
  gaugeProgress: '#1D7A58', gaugeTrack: '#DDE5E0',
  starkGreen: '#1D7A58', accentLime: '#1D7A58', accentLimeMuted: 'rgba(29, 122, 88, 0.52)', accentGreen: '#2F8F68', mustard: '#537C65',
  star: '#1D7A58', pageBg: '#F5F6F2', surface: '#FFFFFF', surfaceMuted: '#E9EEEB', primary: '#176B4D', primaryStrong: '#10563D',
  logoGreen: '#176B4D', logoGreenMuted: 'rgba(23, 107, 77, 0.52)', primarySoft: 'rgba(23, 107, 77, 0.10)', success: '#287A52', successGreen: '#287A52', successSoft: 'rgba(40, 122, 82, 0.12)',
  warning: '#9A6814', warningSoft: 'rgba(154, 104, 20, 0.12)',
  white08: 'rgba(20, 35, 29, 0.06)', white20: 'rgba(20, 35, 29, 0.14)', black06: 'rgba(20, 35, 29, 0.05)',
  shadow: 'rgba(20, 35, 29, 0.14)', blue: '#356EA8', blueSoft: 'rgba(53, 110, 168, 0.10)', amber: '#A66D12', amberSoft: 'rgba(166, 109, 18, 0.10)',
};

export type AppColors = typeof darkColors;
export const colors = lightColors;
