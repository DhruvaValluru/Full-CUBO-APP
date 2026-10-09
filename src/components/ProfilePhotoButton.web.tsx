import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text } from 'react-native';
import { useAppearance } from '../theme/AppearanceContext';

export function ProfilePhotoButton({ onPhoto }: { onPhoto: (uri: string) => void }) {
  const { colors } = useAppearance();
  const choose = () => {
    const input = document.createElement('input'); input.type = 'file'; input.accept = 'image/png,image/jpeg,image/webp';
    input.onchange = () => { const file = input.files?.[0]; if (!file || file.size > 1_500_000) return; const reader = new FileReader(); reader.onload = () => typeof reader.result === 'string' && onPhoto(reader.result); reader.readAsDataURL(file); };
    input.click();
  };
  return <Pressable onPress={choose} style={[styles.button, { backgroundColor: colors.accent }]}><Ionicons name="camera-outline" size={16} color={colors.onAccent} /><Text style={[styles.text, { color: colors.onAccent }]}>Choose photo</Text></Pressable>;
}
const styles = StyleSheet.create({ button: { minHeight: 44, borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 }, text: { fontFamily: 'Manrope_700Bold', fontSize: 12 } });
