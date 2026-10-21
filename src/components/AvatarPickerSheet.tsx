import { Ionicons } from '@expo/vector-icons';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AVATAR_IDS, type AvatarId } from '../features/profile/avatars';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { useAppearance } from '../theme/AppearanceContext';
import type { AppColors } from '../theme/colors';
import { MotionPressable } from './MotionPressable';
import { ProfileAvatar } from './ProfileAvatar';

export function AvatarPickerSheet({ visible, value, busy, onClose, onSelect }: { visible: boolean; value: AvatarId; busy?: boolean; onClose: () => void; onSelect: (value: AvatarId) => void }) {
  const { colors } = useAppearance(); const styles = makeStyles(colors); const reduced = useReducedMotion();
  return <Modal transparent visible={visible} animationType={reduced ? 'none' : 'slide'} onRequestClose={onClose}>
    <View style={styles.backdrop}><Pressable accessibilityLabel="Close avatar picker" style={StyleSheet.absoluteFill} onPress={onClose} />
      <View style={styles.sheet}>
        <View style={styles.handle} />
        <View style={styles.header}><View style={styles.titleCopy}><Text style={styles.title}>Choose Your Avatar</Text><Text style={styles.helper}>Pick the CUBO style that feels like you.</Text></View><MotionPressable accessibilityLabel="Close avatar picker" style={styles.close} onPress={onClose}><Ionicons name="close" size={20} color={colors.text} /></MotionPressable></View>
        <ScrollView contentContainerStyle={styles.grid} showsVerticalScrollIndicator={false}>
          {AVATAR_IDS.map((id, index) => <MotionPressable key={id} disabled={busy} accessibilityRole="radio" accessibilityState={{ checked: id === value }} accessibilityLabel={`Avatar style ${index + 1}`} style={[styles.option, id === value && styles.selected]} onPress={() => onSelect(id)}><ProfileAvatar avatarId={id} size={74} rounded /><View style={[styles.check, id === value && styles.checkSelected]}>{id === value ? <Ionicons name="checkmark" size={14} color={colors.onAccent} /> : null}</View></MotionPressable>)}
        </ScrollView>
        <Text style={styles.footer}>Your avatar and name stay in sync with approved Family and Friend connections.</Text>
      </View>
    </View>
  </Modal>;
}

const makeStyles = (c: AppColors) => StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: '#07120D99' },
  sheet: { maxHeight: '82%', backgroundColor: c.background, borderTopLeftRadius: 30, borderTopRightRadius: 30, paddingHorizontal: 20, paddingTop: 10, paddingBottom: 26, borderWidth: 1, borderColor: c.borderStrong },
  handle: { alignSelf: 'center', width: 42, height: 4, borderRadius: 2, backgroundColor: c.borderStrong, marginBottom: 16 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 }, titleCopy: { flex: 1 }, title: { color: c.text, fontFamily: 'Manrope_800ExtraBold', fontSize: 22 }, helper: { color: c.textSecondary, fontSize: 12, marginTop: 3 },
  close: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: c.card, borderWidth: 1, borderColor: c.border },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 10, paddingBottom: 14 },
  option: { width: '30.5%', minHeight: 94, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: c.card, borderWidth: 1, borderColor: c.border, padding: 8 },
  selected: { borderColor: c.accent, backgroundColor: c.accentSoft, borderWidth: 2 },
  check: { position: 'absolute', right: 6, bottom: 6, width: 22, height: 22, borderRadius: 11, backgroundColor: c.surfaceMuted, alignItems: 'center', justifyContent: 'center' }, checkSelected: { backgroundColor: c.accent },
  footer: { color: c.textTertiary, fontSize: 10, lineHeight: 15, textAlign: 'center' },
});
