import { Ionicons } from '@expo/vector-icons';
import { useNavigation, type NavigationProp } from '@react-navigation/native';
import { Pressable, Text } from 'react-native';
import type { RootStackParamList } from '../navigation/types';
import { useAppearance } from '../theme/AppearanceContext';
export function VoiceTranscriptLink({ sessionId }: { sessionId: string }) {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>(); const { colors: c } = useAppearance();
  return <Pressable accessibilityRole="button" onPress={() => navigation.navigate('VoiceTranscript', { sessionId })} style={{ minHeight: 64, flexDirection: 'row', alignItems: 'center', gap: 12, padding: 20, borderRadius: 22, borderWidth: 1, borderColor: c.border, backgroundColor: c.card }}>
    <Ionicons name="chatbox-ellipses-outline" size={20} color={c.accent} /><Text style={{ flex: 1, color: c.text, fontSize: 16, fontFamily: 'Manrope_700Bold' }}>Voice Assist Transcript</Text><Ionicons name="chevron-forward" size={20} color={c.accent} />
  </Pressable>;
}
