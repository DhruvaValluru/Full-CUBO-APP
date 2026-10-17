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
      <View style={[s.header, compact && { minHeight: 60 }]}><Text style={[s.wordmark, { color: c.text }]}>CUBO</Text><Text style={[s.headerNote, { color: c.textSecondary }]}>Stay Alert. Stay Alive.</Text></View>
      <WelcomeCarousel height={Math.max(140, Math.min(360, availableHeight * (compact ? .26 : .35)))} />
      <View style={[s.copy, compact && { paddingTop: 4, paddingBottom: 16, gap: 10 }]}>
        <Text style={[s.title, { color: c.text }, compact && { fontSize: 30, lineHeight: 35 }]}>Your attention.{'\n'}On the road.</Text>
        <Text style={[s.subtitle, { color: c.textSecondary }, compact && { fontSize: 13, lineHeight: 20 }]}>Focus alerts, driving insights, and family sharing. Get to know your habits and build safer ones with CUBO.</Text>
      </View>
      <View style={s.footer}>
        <MotionPressable accessibilityLabel="Get started with CUBO" onPress={onGetStarted} style={s.button}>
          <Text style={s.buttonText}>Get started</Text><Ionicons name="arrow-forward" size={22} color="#FFFFFF" />
        </MotionPressable>
        <Text style={[s.note, { color: c.textSecondary }]}>A helping hand. Never a substitute for attentive driving.</Text>
      </View>
    </ScrollView>
  </SafeAreaView>;
}
const s = StyleSheet.create({
  page: { flex: 1 }, content: { flexGrow: 1, paddingBottom: 16 },
  header: { minHeight: 72, paddingHorizontal: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 16 },
  wordmark: { fontFamily: 'Manrope_800ExtraBold', fontSize: 26, letterSpacing: 2.6 },
  headerNote: { fontFamily: 'Manrope_500Medium', fontSize: 11 },
  copy: { paddingHorizontal: 24, paddingTop: 8, paddingBottom: 24, gap: 14 },
  title: { fontFamily: 'Manrope_800ExtraBold', fontSize: 36, lineHeight: 41, letterSpacing: -1.3 },
  subtitle: { fontFamily: 'Manrope_400Regular', fontSize: 14, lineHeight: 23, maxWidth: 420 },
  footer: { paddingHorizontal: 24, marginTop: 'auto', gap: 12 },
  button: { minHeight: 58, backgroundColor: '#17694D', borderRadius: 16, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  buttonText: { color: '#FFFFFF', fontFamily: 'Manrope_700Bold', fontSize: 15 },
  note: { fontSize: 10, lineHeight: 16, textAlign: 'center' },
});
