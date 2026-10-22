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
  const { colors: c, mode } = useAppearance();
  return <SafeAreaView onLayout={event => setAvailableHeight(event.nativeEvent.layout.height)} style={[s.page, { backgroundColor: c.background }]}>
    <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />
    <ScrollView bounces={false} showsVerticalScrollIndicator={false} contentContainerStyle={s.content}>
      <View style={[s.header, compact && { minHeight: 58 }]}><View style={s.brand}><View style={[s.brandRail, { backgroundColor: c.accent }]} /><Text style={[s.wordmark, { color: c.text }]}>CUBO</Text></View><Text style={[s.headerNote, { color: c.textSecondary }]}>DRIVER SAFETY</Text></View>
      <WelcomeCarousel height={Math.max(150, Math.min(350, availableHeight * (compact ? .27 : .35)))} />
      <View style={[s.copy, compact && { paddingTop: 4, paddingBottom: 16, gap: 10 }]}>
        <Text style={[s.title, { color: c.text }, compact && { fontSize: 30, lineHeight: 35 }]}>Drive focused.{"\n"}Arrive safer.</Text>
        <Text style={[s.subtitle, { color: c.textSecondary }, compact && { fontSize: 13, lineHeight: 20 }]}>Attention alerts, route guidance, and private sharing for the people you choose—without adding noise to the drive.</Text>
      </View>
      <View style={s.footer}>
        <MotionPressable accessibilityLabel="Get started with CUBO" onPress={onGetStarted} style={[s.button, { backgroundColor: c.accent }]}>
          <Text style={s.buttonText}>Get started</Text><Ionicons name="arrow-forward" size={22} color="#FFFFFF" />
        </MotionPressable>
        <Text style={[s.note, { color: c.textSecondary }]}>A helping hand. Never a substitute for attentive driving.</Text>
      </View>
    </ScrollView>
  </SafeAreaView>;
}
const s = StyleSheet.create({
  page: { flex: 1 }, content: { flexGrow: 1, paddingBottom: 16 },
  header: { minHeight: 68, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 16 },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 10 }, brandRail: { width: 4, height: 24, borderRadius: 2 },
  wordmark: { fontFamily: 'Manrope_800ExtraBold', fontSize: 24, letterSpacing: 2.2 },
  headerNote: { fontFamily: 'Manrope_700Bold', fontSize: 9, letterSpacing: 1.4 },
  copy: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 20, gap: 11 },
  title: { fontFamily: 'Manrope_800ExtraBold', fontSize: 36, lineHeight: 40, letterSpacing: -1.4 },
  subtitle: { fontFamily: 'Manrope_400Regular', fontSize: 14, lineHeight: 21, maxWidth: 430 },
  footer: { paddingHorizontal: 20, marginTop: 'auto', gap: 10 },
  button: { minHeight: 56, borderRadius: 12, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  buttonText: { color: '#FFFFFF', fontFamily: 'Manrope_700Bold', fontSize: 15 },
  note: { fontSize: 10, lineHeight: 16, textAlign: 'center' },
});
