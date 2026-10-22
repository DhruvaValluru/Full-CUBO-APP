import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MotionPressable } from '../components/MotionPressable';
import { useAppearance } from '../theme/AppearanceContext';
import { WelcomeCarousel } from '../components/WelcomeCarousel';

type Props = { onGetStarted: () => void };

export function WelcomeScreen({ onGetStarted }: Props) {
  const { height } = useWindowDimensions();
  const [availableHeight, setAvailableHeight] = useState(height);
  const compact = availableHeight < 680;
  const { colors: c } = useAppearance();
  const heroHeight = Math.max(600, availableHeight);
  return <SafeAreaView onLayout={event => setAvailableHeight(event.nativeEvent.layout.height)} style={[s.page, { backgroundColor: c.background }]}>
    <StatusBar style="light" />
    <View style={s.hero}>
      <WelcomeCarousel height={heroHeight} />
      <View style={s.header}><Text style={s.wordmark}>CUBO</Text><Text style={s.headerNote}>Your drive, understood.</Text></View>
      <View style={[s.copy, compact && s.copyCompact]}>
        <Text style={[s.title, compact && s.titleCompact]}>Stay with the road.</Text>
        <Text style={[s.subtitle, compact && s.subtitleCompact]}>Distraction alerts, live routes, and the people you choose—together for every drive.</Text>
        <MotionPressable accessibilityLabel="Get started with CUBO" onPress={onGetStarted} style={[s.button, { backgroundColor: c.accent }]}>
          <Text style={s.buttonText}>Get started</Text><View style={s.buttonIcon}><Ionicons name="arrow-forward" size={18} color="#FFFFFF" /></View>
        </MotionPressable>
        <View style={s.noteRow}><Ionicons name="shield-checkmark-outline" size={14} color="#A8E4C2" /><Text style={s.note}>A helping hand—not a substitute for attentive driving.</Text></View>
      </View>
    </View>
  </SafeAreaView>;
}
const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#07130E' }, hero: { flex: 1, position: 'relative', overflow: 'hidden' },
  header: { position: 'absolute', top: 0, left: 0, right: 0, minHeight: 70, paddingHorizontal: 22, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 16 },
  wordmark: { color: '#FFFFFF', fontFamily: 'Manrope_800ExtraBold', fontSize: 25, letterSpacing: 4.2, textShadowColor: 'rgba(0,0,0,.35)', textShadowRadius: 8 },
  headerNote: { color: '#E2EEE8', fontFamily: 'Manrope_600SemiBold', fontSize: 10, letterSpacing: .3, textShadowColor: 'rgba(0,0,0,.38)', textShadowRadius: 6 },
  copy: { position: 'absolute', left: 0, right: 0, bottom: 16, paddingHorizontal: 22, gap: 14 },
  copyCompact: { bottom: 8, gap: 10 },
  title: { color: '#FFFFFF', fontFamily: 'Manrope_800ExtraBold', fontSize: 42, lineHeight: 46, letterSpacing: -1.8, maxWidth: 370, textShadowColor: 'rgba(0,0,0,.45)', textShadowRadius: 12 },
  titleCompact: { fontSize: 34, lineHeight: 38 },
  subtitle: { color: '#E0ECE6', fontFamily: 'Manrope_500Medium', fontSize: 14, lineHeight: 21, maxWidth: 410, textShadowColor: 'rgba(0,0,0,.5)', textShadowRadius: 8 },
  subtitleCompact: { fontSize: 12, lineHeight: 18 },
  button: { minHeight: 58, borderRadius: 16, paddingLeft: 20, paddingRight: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', shadowColor: '#000000', shadowOpacity: .24, shadowRadius: 18, shadowOffset: { width: 0, height: 9 }, elevation: 7 },
  buttonText: { color: '#FFFFFF', fontFamily: 'Manrope_700Bold', fontSize: 15 },
  buttonIcon: { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,.14)', alignItems: 'center', justifyContent: 'center' },
  noteRow: { minHeight: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  note: { color: '#D7E7DF', fontFamily: 'Manrope_400Regular', fontSize: 9, lineHeight: 15, textAlign: 'center', textShadowColor: 'rgba(0,0,0,.5)', textShadowRadius: 5 },
});
