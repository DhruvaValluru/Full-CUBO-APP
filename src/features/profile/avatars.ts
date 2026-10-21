import type { ImageSourcePropType } from 'react-native';

export const AVATAR_IDS = [
  'masc-01', 'masc-02', 'masc-03', 'masc-04', 'masc-05', 'masc-06',
  'fem-01', 'fem-02', 'fem-03', 'fem-04', 'fem-05', 'fem-06',
] as const;

export type AvatarId = (typeof AVATAR_IDS)[number];

const sources: Record<AvatarId, ImageSourcePropType> = {
  'masc-01': require('../../../assets/avatars/masc-01.png'),
  'masc-02': require('../../../assets/avatars/masc-02.png'),
  'masc-03': require('../../../assets/avatars/masc-03.png'),
  'masc-04': require('../../../assets/avatars/masc-04.png'),
  'masc-05': require('../../../assets/avatars/masc-05.png'),
  'masc-06': require('../../../assets/avatars/masc-06.png'),
  'fem-01': require('../../../assets/avatars/fem-01.png'),
  'fem-02': require('../../../assets/avatars/fem-02.png'),
  'fem-03': require('../../../assets/avatars/fem-03.png'),
  'fem-04': require('../../../assets/avatars/fem-04.png'),
  'fem-05': require('../../../assets/avatars/fem-05.png'),
  'fem-06': require('../../../assets/avatars/fem-06.png'),
};

export function isAvatarId(value: unknown): value is AvatarId {
  return typeof value === 'string' && (AVATAR_IDS as readonly string[]).includes(value);
}

export function defaultAvatarId(uid = 'cubo-driver'): AvatarId {
  let hash = 0;
  for (let index = 0; index < uid.length; index += 1) hash = ((hash * 31) + uid.charCodeAt(index)) >>> 0;
  return AVATAR_IDS[hash % AVATAR_IDS.length];
}

export function avatarSource(value: unknown, uid?: string): ImageSourcePropType {
  return sources[isAvatarId(value) ? value : defaultAvatarId(uid)];
}
