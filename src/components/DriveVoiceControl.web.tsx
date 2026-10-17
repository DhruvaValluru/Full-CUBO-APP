import { Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppearance } from '../theme/AppearanceContext';

/** Visual toggle only. Microphone off; commands are not connected yet. */
export function DriveVoiceControl({ enabled, onToggle }: { enabled: boolean; onToggle: () => void }) {
  const { colors: c } = useAppearance();
  return <Pressable accessibilityRole="switch" accessibilityLabel="AI voice preview, commands not connected" accessibilityState={{ checked: enabled }} onPress={onToggle} style={{ flex: .54, minWidth: 44, minHeight: 46, alignItems: 'center', justifyContent: 'center', borderRadius: 14, backgroundColor: enabled ? c.accent : c.surfaceMuted, borderWidth: 1, borderColor: enabled ? c.accent : c.borderStrong }}>
    <Ionicons name="sparkles-outline" size={22} color={enabled ? c.onAccent : c.textSecondary} />
  </Pressable>;
}
