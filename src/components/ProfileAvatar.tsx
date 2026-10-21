import { Image, StyleSheet, View } from 'react-native';

import { avatarSource, type AvatarId } from '../features/profile/avatars';
import { useAppearance } from '../theme/AppearanceContext';

export function ProfileAvatar({ avatarId, photoUri, uid, size = 52, rounded = false }: { avatarId?: AvatarId | string; photoUri?: string; uid?: string; size?: number; rounded?: boolean }) {
  const { colors } = useAppearance();
  const radius = rounded ? size / 2 : Math.round(size * .34);
  return <View style={[styles.shell, { width: size, height: size, borderRadius: radius, backgroundColor: colors.accentSoft, borderColor: colors.borderStrong }]}>
    <Image accessibilityIgnoresInvertColors source={photoUri ? { uri: photoUri } : avatarSource(avatarId, uid)} style={styles.image} />
  </View>;
}

const styles = StyleSheet.create({
  shell: { overflow: 'hidden', borderWidth: StyleSheet.hairlineWidth, alignItems: 'center', justifyContent: 'center' },
  image: { width: '100%', height: '100%', resizeMode: 'cover' },
});
