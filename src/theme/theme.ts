import { colors } from './colors';

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 20,
  xl: 24,
  xxl: 32,
};

export const radii = {
  sm: 10,
  md: 14,
  lg: 18,
  xl: 22,
  xxl: 28,
  pill: 999,
};

export const shadows = {
  card: {
    shadowColor: '#000',
    shadowOpacity: 0.16,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 10 },
    elevation: 5,
  },
  phone: {
    shadowColor: '#000',
    shadowOpacity: 0.45,
    shadowRadius: 32,
    shadowOffset: { width: 0, height: 18 },
    elevation: 12,
  },
};

/** System stack for SF Pro–like hierarchy on iOS / Roboto on Android */
export const fonts = {
  /** Use default system UI — matches reference “clean sans” */
  regular: { fontFamily: undefined as string | undefined, fontWeight: '400' as const },
  medium: { fontFamily: undefined as string | undefined, fontWeight: '500' as const },
  semibold: { fontFamily: undefined as string | undefined, fontWeight: '600' as const },
  bold: { fontFamily: undefined as string | undefined, fontWeight: '700' as const },
  heavy: { fontFamily: undefined as string | undefined, fontWeight: '800' as const },
};
