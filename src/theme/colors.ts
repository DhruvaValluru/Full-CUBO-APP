/** CUBO contrast refresh: cool dark surfaces, clean light neutrals, and CUBO green actions. */
export const darkColors = {
  background: '#10191E',
  card: '#1C2A32',
  cardHover: '#2B3C45',
  cardElevated: '#253842',
  border: 'rgba(175, 210, 215, 0.15)',
  borderLight: 'rgba(175, 210, 215, 0.10)',
  borderStrong: 'rgba(175, 210, 215, 0.25)',

  text: '#F4F8F7',
  featureSurface: '#173E32', featureText: '#F7FAF8', featureMuted: '#C8DCD7',
  featureAction: '#8ACDB0', featureActionText: '#24372F',
  secondarySurface: '#203D34', secondaryInk: '#A8D8BE',
  textSecondary: '#BACCD0',
  textMuted: '#BACCD0',
  textTertiary: '#A0B5BC',
  accent: '#8ACDB0',
  accentSecondary: '#B1DDC9',
  accentSoft: 'rgba(138, 205, 176, 0.14)',
  onAccent: '#10271D',
  mapSurface: '#242C37',

  /** Semicircle / ring — stark green on dark track */
  gaugeProgress: '#8ACDB0',
  gaugeTrack: '#3A3A3C',

  /** Stark green accents (replaces former yellow / lime) */
  starkGreen: '#8ACDB0',
  accentLime: '#8ACDB0',
  accentLimeMuted: 'rgba(138, 205, 176, 0.55)',
  accentGreen: '#8ACDB0',
  mustard: '#D5B168',

  star: '#8ACDB0',
  danger: '#FF453A',
  dangerMuted: '#C62828',
  amber: '#FFB020',
  amberSoft: 'rgba(255, 176, 32, 0.14)',
  blue: '#58A6FF',
  blueSoft: 'rgba(88, 166, 255, 0.14)',

  successGreen: '#34C759',

  splashBg: '#000000',
  splashText: '#FFFFFF',
  logoGreen: '#8ACDB0',
  logoGreenMuted: 'rgba(138, 205, 176, 0.55)',

  pageBg: '#10191E',

  surface: '#1C2A32',
  surfaceMuted: '#273B43',
  primary: '#8ACDB0',
  primaryStrong: '#B1DDC9',
  primarySoft: 'rgba(138, 205, 176, 0.14)',
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
  background: '#F5F7F5', card: '#FFFFFF', cardHover: '#EAF0EC', cardElevated: '#FFFFFF',
  border: 'rgba(18, 63, 46, 0.11)', borderLight: 'rgba(18, 63, 46, 0.07)', borderStrong: 'rgba(18, 91, 62, 0.24)',
  text: '#16251D', textSecondary: '#506158', textMuted: '#506158', textTertiary: '#52645A',
  accent: '#14734F', accentSecondary: '#205E44', accentSoft: 'rgba(17, 100, 78, 0.12)', onAccent: '#FFFFFF', mapSurface: '#E1ECE6',
  featureSurface: '#153F2D', featureText: '#F7FAF8', featureMuted: '#C8DCD7',
  featureAction: '#E2F1E7', featureActionText: '#24372F',
  secondarySurface: '#E7F1EA', secondaryInk: '#245F42',
  gaugeProgress: '#1D7A58', gaugeTrack: '#DDE5E0',
  starkGreen: '#1D7A58', accentLime: '#1D7A58', accentLimeMuted: 'rgba(29, 122, 88, 0.52)', accentGreen: '#2F8F68', mustard: '#537C65',
  star: '#1D7A58', pageBg: '#F5F7F5', surface: '#FFFFFF', surfaceMuted: '#E9EFEB', primary: '#14734F', primaryStrong: '#0E5B3F',
  logoGreen: '#14734F', logoGreenMuted: 'rgba(17, 100, 78, 0.52)', primarySoft: 'rgba(17, 100, 78, 0.11)', success: '#287A52', successGreen: '#287A52', successSoft: 'rgba(40, 122, 82, 0.12)',
  warning: '#9A6814', warningSoft: 'rgba(154, 104, 20, 0.12)',
  white08: 'rgba(20, 35, 29, 0.06)', white20: 'rgba(20, 35, 29, 0.14)', black06: 'rgba(20, 35, 29, 0.05)',
  shadow: 'rgba(20, 35, 29, 0.14)', blue: '#356EA8', blueSoft: 'rgba(53, 110, 168, 0.10)', amber: '#A66D12', amberSoft: 'rgba(166, 109, 18, 0.10)',
};

export type AppColors = typeof darkColors;
export const colors = lightColors;
