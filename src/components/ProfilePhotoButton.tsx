import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text } from 'react-native';
import { useAppearance } from '../theme/AppearanceContext';
export function ProfilePhotoButton({ onPhoto: _onPhoto }: { onPhoto: (uri: string) => void }) { const { colors } = useAppearance(); return <Pressable style={[styles.button, { backgroundColor: colors.surfaceMuted }]}><Ionicons name="camera-outline" size={16} color={colors.textSecondary} /><Text style={[styles.text, { color: colors.textSecondary }]}>Photo picker ready for native build</Text></Pressable>; }
const styles = StyleSheet.create({ button: { minHeight: 44, borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 }, text: { fontFamily: 'Manrope_700Bold', fontSize: 11 } });
