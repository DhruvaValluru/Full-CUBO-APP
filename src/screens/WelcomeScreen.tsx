import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { Image, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Defs, LinearGradient as SvgGradient, Path, Stop } from 'react-native-svg';

type Props = { onGetStarted: () => void };

const P = {
  bg: '#050806', surface: '#111814', elevated: '#17221B',
  border: 'rgba(203,234,216,0.14)', borderStrong: 'rgba(203,234,216,0.22)',
  green: '#39C77A', deepGreen: '#17613B', mint: '#9DE0B9',
  text: '#F2F7F4', muted: '#92A39A', faint: '#68766F',
};

const cuboEyeMark = require('../../assets/cubo-eye-mark.png');

function DriveCard({ compact }: { compact: boolean }) {
  return (
    <View accessible={false} importantForAccessibility="no-hide-descendants"
      style={[s.visualStage, compact && s.visualStageCompact]}>
      <LinearGradient colors={['rgba(57,199,122,0.24)', 'rgba(23,97,59,0.06)', 'rgba(5,8,6,0)']}
        style={s.ambientGlow} />
      <View style={s.backCard} />
      <LinearGradient colors={['#1B2C22', '#111A15', '#0C120F']}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={[s.driveCard, compact && s.driveCardCompact]}>
        <View style={s.cardTopRow}>
          <View>
            <Text style={s.cardLabel}>CUBO DRIVE</Text>
            <Text style={s.cardTitle}>Ready when you are.</Text>
          </View>
          <View style={s.readyBadge}><View style={s.readyDot} /><Text style={s.readyText}>Protected</Text></View>
        </View>

        <View style={s.routeCanvas}>
          <View style={[s.gridLine, s.gridH1]} /><View style={[s.gridLine, s.gridH2]} />
          <View style={[s.gridLine, s.gridV1]} /><View style={[s.gridLine, s.gridV2]} />
          <Svg width="100%" height="100%" viewBox="0 0 300 132">
            <Defs><SvgGradient id="route" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor={P.mint} /><Stop offset="1" stopColor={P.green} />
            </SvgGradient></Defs>
            <Path d="M25 103 C63 103 68 58 105 62 C143 66 141 104 181 92 C218 81 211 37 273 29"
              fill="none" stroke="rgba(205,239,219,0.10)" strokeWidth="10" strokeLinecap="round" />
            <Path d="M25 103 C63 103 68 58 105 62 C143 66 141 104 181 92 C218 81 211 37 273 29"
              fill="none" stroke="url(#route)" strokeWidth="4" strokeLinecap="round" />
            <Circle cx="25" cy="103" r="8" fill={P.surface} stroke={P.mint} strokeWidth="3" />
            <Circle cx="273" cy="29" r="9" fill={P.green} /><Circle cx="273" cy="29" r="3" fill={P.bg} />
          </Svg>
          <View style={s.focusMarker}><Ionicons name="shield-checkmark" size={22} color={P.bg} /></View>
        </View>

        <View style={s.cardFooter}>
          <View style={s.metric}>
            <Ionicons name="eye-outline" size={17} color={P.mint} />
            <View><Text style={s.metricValue}>Focus ready</Text><Text style={s.metricLabel}>On-device detection</Text></View>
          </View>
          <View style={s.arrowButton}><Ionicons name="navigate" size={18} color={P.text} /></View>
        </View>
      </LinearGradient>
    </View>
  );
}

export function WelcomeScreen({ onGetStarted }: Props) {
  const compact = useWindowDimensions().height < 720;
  return (
    <LinearGradient colors={['#0B2115', P.bg, P.bg]} locations={[0, 0.36, 1]} style={s.safe}>
      <StatusBar style="light" />
      <SafeAreaView style={s.background}>
        <View style={s.header}>
          <Image accessibilityIgnoresInvertColors source={cuboEyeMark} style={s.brandMark} />
          <Text style={s.wordmark}>CUBO</Text>
        </View>
        <DriveCard compact={compact} />
        <View style={[s.copy, compact && s.copyCompact]}>
          <Text style={[s.title, compact && s.titleCompact]}>Every drive.{`\n`}Safer together.</Text>
          <Text style={s.subtitle}>Real-time focus alerts, navigation, and family peace of mind—built around your privacy.</Text>
        </View>
        <View style={[s.bottom, compact && s.bottomCompact]}>
          <Pressable accessibilityLabel="Get started with CUBO" accessibilityRole="button"
            onPress={onGetStarted} style={({ pressed }) => [s.cta, pressed && s.ctaPressed]}>
            <Text style={s.ctaText}>Get started</Text>
            <View style={s.ctaArrow}><Ionicons name="arrow-forward" size={19} color={P.bg} /></View>
          </Pressable>
          <View style={s.privacyRow}>
            <Ionicons name="lock-closed-outline" size={12} color={P.faint} />
            <Text style={s.privacyText}>Private by design · On-device processing</Text>
          </View>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1 },
  background: { flex: 1, paddingHorizontal: 22, paddingTop: 8, paddingBottom: 12 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 11, minHeight: 52 },
  brandMark: { width: 48, height: 48 },
  wordmark: { color: P.text, fontFamily: 'Manrope_800ExtraBold', fontSize: 21, letterSpacing: 2.8 },
  visualStage: { flex: 1, minHeight: 310, justifyContent: 'center', alignItems: 'center', position: 'relative', marginHorizontal: -2 },
  visualStageCompact: { minHeight: 218 },
  ambientGlow: { position: 'absolute', top: '4%', width: '118%', height: '85%', borderRadius: 160 },
  backCard: {
    position: 'absolute', width: '83%', height: '64%', maxHeight: 260, minHeight: 210, borderRadius: 30,
    backgroundColor: '#163722', borderWidth: 1, borderColor: 'rgba(157,224,185,0.12)',
    transform: [{ rotate: '8deg' }, { translateX: 17 }], opacity: 0.72,
  },
  driveCard: {
    width: '91%', maxWidth: 360, minHeight: 274, borderRadius: 28, borderWidth: 1, borderColor: P.borderStrong,
    padding: 18, transform: [{ rotate: '-4deg' }], shadowColor: '#000', shadowOpacity: 0.42,
    shadowRadius: 28, shadowOffset: { width: 0, height: 18 }, elevation: 14, overflow: 'hidden',
  },
  driveCardCompact: { minHeight: 218, padding: 15 },
  cardTopRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  cardLabel: { color: P.green, fontFamily: 'Manrope_800ExtraBold', fontSize: 8, letterSpacing: 1.55 },
  cardTitle: { color: P.text, fontFamily: 'Manrope_700Bold', fontSize: 17, marginTop: 4 },
  readyBadge: {
    height: 27, flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 9, borderRadius: 10,
    backgroundColor: 'rgba(157,224,185,0.08)', borderWidth: StyleSheet.hairlineWidth, borderColor: P.border,
  },
  readyDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: P.green },
  readyText: { color: P.mint, fontFamily: 'Manrope_700Bold', fontSize: 8 },
  routeCanvas: { flex: 1, minHeight: 112, marginHorizontal: -4, marginVertical: 4, position: 'relative', overflow: 'hidden' },
  gridLine: { position: 'absolute', backgroundColor: 'rgba(203,234,216,0.045)' },
  gridH1: { left: 0, right: 0, top: '34%', height: 1, transform: [{ rotate: '-6deg' }] },
  gridH2: { left: 0, right: 0, top: '72%', height: 1, transform: [{ rotate: '5deg' }] },
  gridV1: { top: 0, bottom: 0, left: '32%', width: 1, transform: [{ rotate: '13deg' }] },
  gridV2: { top: 0, bottom: 0, left: '70%', width: 1, transform: [{ rotate: '-10deg' }] },
  focusMarker: {
    position: 'absolute', left: '44%', top: '35%', width: 42, height: 42, borderRadius: 15,
    alignItems: 'center', justifyContent: 'center', backgroundColor: P.green, borderWidth: 4,
    borderColor: '#21342A', shadowColor: P.green, shadowOpacity: 0.35, shadowRadius: 12,
  },
  cardFooter: {
    minHeight: 54, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: P.border, paddingTop: 12,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  metric: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  metricValue: { color: P.text, fontFamily: 'Manrope_700Bold', fontSize: 10 },
  metricLabel: { color: P.muted, fontSize: 8, marginTop: 1 },
  arrowButton: {
    width: 38, height: 38, borderRadius: 14, alignItems: 'center', justifyContent: 'center',
    backgroundColor: P.elevated, borderWidth: StyleSheet.hairlineWidth, borderColor: P.border,
  },
  copy: { alignItems: 'center', paddingHorizontal: 10 },
  copyCompact: { marginTop: -4 },
  title: {
    color: P.text, fontFamily: 'Manrope_800ExtraBold', fontSize: 38, lineHeight: 42,
    letterSpacing: -1.7, textAlign: 'center',
  },
  titleCompact: { fontSize: 33, lineHeight: 37 },
  subtitle: {
    color: P.muted, fontFamily: 'Manrope_500Medium', fontSize: 12, lineHeight: 19,
    textAlign: 'center', maxWidth: 340, marginTop: 11,
  },
  bottom: { marginTop: 22 },
  bottomCompact: { marginTop: 14 },
  cta: {
    minHeight: 60, borderRadius: 19, backgroundColor: P.green, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'space-between', paddingLeft: 22, paddingRight: 9,
    shadowColor: P.deepGreen, shadowOpacity: 0.36, shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 }, elevation: 6,
  },
  ctaPressed: { backgroundColor: '#31B66E', opacity: 0.96 },
  ctaText: { color: P.bg, fontFamily: 'Manrope_800ExtraBold', fontSize: 14 },
  ctaArrow: {
    width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(5,8,6,0.12)',
  },
  privacyRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, marginTop: 10 },
  privacyText: { color: P.faint, fontSize: 8.5 },
});
