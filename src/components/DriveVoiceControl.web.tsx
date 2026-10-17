import { useState } from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppearance } from '../theme/AppearanceContext';

/** Interface preview only: never requests the microphone or starts inference. */
export function DriveVoiceControl() {
  const { colors: c } = useAppearance();
  const [enabled, setEnabled] = useState(false);
  return <View style={{ marginTop: 8 }}>
    <Pressable accessibilityRole="switch" accessibilityLabel="CUBO voice interface preview" accessibilityState={{ checked: enabled }} onPress={() => setEnabled(value => !value)} style={{ alignSelf: 'flex-end', minHeight: 44, flexDirection: 'row', gap: 8, alignItems: 'center', borderRadius: 14, paddingHorizontal: 12, backgroundColor: enabled ? c.accentSoft : c.surfaceMuted, borderWidth: 1, borderColor: enabled ? c.accent : c.border }}>
      <Image source={require('../../assets/cubo-logo.png')} style={{ width: 24, height: 24 }} resizeMode="contain" />
      <Text style={{ color: c.text, fontFamily: 'Manrope_700Bold', fontSize: 12 }}>CUBO voice · {enabled ? 'Preview on' : 'Off'}</Text>
      <Ionicons name="mic-off-outline" size={18} color={c.textSecondary} />
    </Pressable>
    {enabled && <Text accessibilityLiveRegion="polite" style={{ color: c.textSecondary, fontSize: 12, lineHeight: 18, marginTop: 8 }}>Interface preview only. Microphone off; voice commands are not connected yet.</Text>}
  </View>;
}
