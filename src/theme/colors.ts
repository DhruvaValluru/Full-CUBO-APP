/** CUBO vehicle-grade palette: mineral light surfaces, green-black dark surfaces, and restrained signal green. */
export const darkColors = {
  background: '#07130E',
  card: '#0F2119',
  cardHover: '#173126',
  cardElevated: '#142A21',
  border: 'rgba(190, 224, 207, 0.13)',
  borderLight: 'rgba(190, 224, 207, 0.08)',
  borderStrong: 'rgba(190, 224, 207, 0.22)',

  text: '#F4F8F7',
  shortcutSurface: '#20372E', shortcutText: '#F4F8F7',
  messageSurface: '#1D4836', messageText: '#F4F8F7',
  composerSurface: '#192923',
  featureSurface: '#123D2C', featureText: '#F7FAF8', featureMuted: '#C8DCD7',
  featureAction: '#71D3A4', featureActionText: '#24372F',
  secondarySurface: '#203D34', secondaryInk: '#A8D8BE',
  textSecondary: '#B8CDC3',
  textMuted: '#B8CDC3',
  textTertiary: '#91AA9E',
  accent: '#63CF93',
  accentSecondary: '#9BE6B9',
  accentSoft: 'rgba(99, 207, 147, 0.13)',
  onAccent: '#062216',
  mapSurface: '#17251F',

  /** Semicircle / ring — stark green on dark track */
  gaugeProgress: '#71D3A4',
  gaugeTrack: '#3A3A3C',

  /** Stark green accents (replaces former yellow / lime) */
  starkGreen: '#71D3A4',
  accentLime: '#71D3A4',
  accentLimeMuted: 'rgba(113, 211, 164, 0.55)',
  accentGreen: '#71D3A4',
  mustard: '#D5B168',

  star: '#71D3A4',
  danger: '#FF453A',
  dangerMuted: '#C62828',
  amber: '#FFB020',
  amberSoft: 'rgba(255, 176, 32, 0.14)',
  blue: '#58A6FF',
  blueSoft: 'rgba(88, 166, 255, 0.14)',

  successGreen: '#34C759',

  splashBg: '#000000',
  splashText: '#FFFFFF',
  logoGreen: '#71D3A4',
  logoGreenMuted: 'rgba(113, 211, 164, 0.55)',

  pageBg: '#07130E',

  surface: '#0F2119',
  surfaceMuted: '#183027',
  primary: '#63CF93',
  primaryStrong: '#9BE6B9',
  primarySoft: 'rgba(99, 207, 147, 0.13)',
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
  shortcutSurface: '#FFFFFF', shortcutText: '#16251D',
  messageSurface: '#E0F2E7', messageText: '#163C29',
  composerSurface: '#FFFFFF',
  background: '#F7F8F6', card: '#FFFFFF', cardHover: '#E7EDE8', cardElevated: '#FFFFFF',
  border: 'rgba(13, 61, 41, 0.10)', borderLight: 'rgba(13, 61, 41, 0.06)', borderStrong: 'rgba(13, 76, 49, 0.19)',
  text: '#102019', textSecondary: '#53635A', textMuted: '#53635A', textTertiary: '#5E6E65',
  accent: '#087D52', accentSecondary: '#185F43', accentSoft: 'rgba(8, 125, 82, 0.10)', onAccent: '#FFFFFF', mapSurface: '#DEE9E1',
  featureSurface: '#073B25', featureText: '#F8FBF9', featureMuted: '#C9DED3',
  featureAction: '#BFE9CD', featureActionText: '#24372F',
  secondarySurface: '#E7F1EA', secondaryInk: '#245F42',
  gaugeProgress: '#1D7A58', gaugeTrack: '#DDE5E0',
  starkGreen: '#1D7A58', accentLime: '#1D7A58', accentLimeMuted: 'rgba(29, 122, 88, 0.52)', accentGreen: '#2F8F68', mustard: '#537C65',
  star: '#1D7A58', pageBg: '#F7F8F6', surface: '#FFFFFF', surfaceMuted: '#F0F3F0', primary: '#087D52', primaryStrong: '#0B5F40',
  logoGreen: '#08784F', logoGreenMuted: 'rgba(17, 100, 78, 0.52)', primarySoft: 'rgba(17, 100, 78, 0.11)', success: '#287A52', successGreen: '#287A52', successSoft: 'rgba(40, 122, 82, 0.12)',
  warning: '#9A6814', warningSoft: 'rgba(154, 104, 20, 0.12)',
  white08: 'rgba(20, 35, 29, 0.06)', white20: 'rgba(20, 35, 29, 0.14)', black06: 'rgba(20, 35, 29, 0.05)',
  shadow: 'rgba(20, 35, 29, 0.14)', blue: '#356EA8', blueSoft: 'rgba(53, 110, 168, 0.10)', amber: '#A66D12', amberSoft: 'rgba(166, 109, 18, 0.10)',
};

export type AppColors = typeof darkColors;
export const colors = lightColors;
