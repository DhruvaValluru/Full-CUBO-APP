import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
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
  const heroHeight = Math.max(300, Math.min(470, availableHeight * (compact ? .47 : .54)));
  return <SafeAreaView onLayout={event => setAvailableHeight(event.nativeEvent.layout.height)} style={[s.page, { backgroundColor: c.background }]}>
    <StatusBar style="light" />
    <ScrollView bounces={false} showsVerticalScrollIndicator={false} contentContainerStyle={s.content}>
      <View style={s.hero}>
        <WelcomeCarousel height={heroHeight} />
        <View style={s.header}><Text style={s.wordmark}>CUBO</Text><Text style={s.headerNote}>Your drive, understood.</Text></View>
      </View>
      <View style={[s.copy, compact && { paddingTop: 20, paddingBottom: 14, gap: 10 }]}>
        <Text style={[s.title, { color: c.text }, compact && { fontSize: 32, lineHeight: 36 }]}>Stay with the road.</Text>
        <Text style={[s.subtitle, { color: c.textSecondary }, compact && { fontSize: 13, lineHeight: 20 }]}>CUBO watches for distraction, guides the route, and keeps the people you choose in the loop.</Text>
      </View>
      <View style={s.footer}>
        <MotionPressable accessibilityLabel="Get started with CUBO" onPress={onGetStarted} style={[s.button, { backgroundColor: c.accent }]}>
          <Text style={s.buttonText}>Get started</Text><View style={s.buttonIcon}><Ionicons name="arrow-forward" size={18} color="#FFFFFF" /></View>
        </MotionPressable>
        <View style={s.noteRow}><Ionicons name="shield-checkmark-outline" size={14} color={c.accent} /><Text style={[s.note, { color: c.textSecondary }]}>A helping hand—not a substitute for attentive driving.</Text></View>
      </View>
    </ScrollView>
  </SafeAreaView>;
}
const s = StyleSheet.create({
  page: { flex: 1 }, content: { flexGrow: 1, paddingBottom: 18 }, hero: { position: 'relative' },
  header: { position: 'absolute', top: 0, left: 0, right: 0, minHeight: 64, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 16 },
  wordmark: { color: '#FFFFFF', fontFamily: 'Manrope_800ExtraBold', fontSize: 23, letterSpacing: 2.6, textShadowColor: 'rgba(0,0,0,.28)', textShadowRadius: 6 },
  headerNote: { color: '#FFFFFF', fontFamily: 'Manrope_600SemiBold', fontSize: 10, letterSpacing: .2, textShadowColor: 'rgba(0,0,0,.32)', textShadowRadius: 5 },
  copy: { paddingHorizontal: 20, paddingTop: 26, paddingBottom: 20, gap: 12 },
  title: { fontFamily: 'Manrope_800ExtraBold', fontSize: 40, lineHeight: 44, letterSpacing: -1.5 },
  subtitle: { fontFamily: 'Manrope_400Regular', fontSize: 14, lineHeight: 22, maxWidth: 430 },
  footer: { paddingHorizontal: 20, marginTop: 'auto', gap: 12 },
  button: { minHeight: 58, borderRadius: 10, paddingLeft: 18, paddingRight: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  buttonText: { color: '#FFFFFF', fontFamily: 'Manrope_700Bold', fontSize: 15 },
  buttonIcon: { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,.14)', alignItems: 'center', justifyContent: 'center' },
  noteRow: { minHeight: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  note: { fontFamily: 'Manrope_400Regular', fontSize: 10, lineHeight: 16, textAlign: 'center' },
});
