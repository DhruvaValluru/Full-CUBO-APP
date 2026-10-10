import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { MotionPressable } from './MotionPressable';
import { useAppearance } from '../theme/AppearanceContext';
import type { AppColors } from '../theme/colors';

export function ConfirmSheet({ visible, title, body, confirmLabel, onCancel, onConfirm, destructive = true }: { visible: boolean; title: string; body: string; confirmLabel: string; onCancel: () => void; onConfirm: () => void; destructive?: boolean }) {
  const { colors: c } = useAppearance();
  const s = makeThemeStyles(c);

  const reduced = useReducedMotion();
  return <Modal transparent visible={visible} animationType={reduced ? 'none' : 'fade'} onRequestClose={onCancel}><View style={s.root}><Pressable style={StyleSheet.absoluteFill} accessibilityLabel="Cancel" onPress={onCancel} /><View accessibilityViewIsModal style={s.sheet}><View style={s.handle} /><Text style={s.title}>{title}</Text><Text style={s.body}>{body}</Text><MotionPressable style={[s.delete, !destructive && { backgroundColor: c.accent }]} onPress={onConfirm}><Text style={[s.white, destructive && { color: '#FFFFFF' }]}>{confirmLabel}</Text></MotionPressable><MotionPressable style={s.cancel} onPress={onCancel}><Text style={s.label}>Cancel</Text></MotionPressable></View></View></Modal>;
}
const makeThemeStyles = (c: AppColors) => StyleSheet.create({ root: { flex: 1, backgroundColor: '#10261D66', justifyContent: 'flex-end' }, sheet: { backgroundColor: c.card, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 36, gap: 16 }, handle: { width: 36, height: 4, borderRadius: 2, backgroundColor: c.border, alignSelf: 'center' }, title: { fontSize: 22, fontFamily: 'Manrope_800ExtraBold', color: c.text }, body: { fontSize: 14, lineHeight: 22, color: c.textSecondary }, delete: { minHeight: 52, backgroundColor: c.danger, borderRadius: 16, alignItems: 'center', justifyContent: 'center' }, cancel: { minHeight: 48, alignItems: 'center', justifyContent: 'center' }, white: { color: c.onAccent, fontFamily: 'Manrope_700Bold', fontSize: 14 }, label: { color: c.text, fontFamily: 'Manrope_700Bold', fontSize: 14 } });
