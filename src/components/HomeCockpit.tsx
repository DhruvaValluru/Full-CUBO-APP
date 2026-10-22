import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, RadialGradient, LinearGradient as SvgGradient, Stop, Rect } from 'react-native-svg';
import { MotionPressable } from './MotionPressable';
import { ProfileAvatar } from './ProfileAvatar';
import { Reveal } from './Reveal';

type Props = { name: string; avatarId?: string; photoUri?: string; uid?: string; score: number; measured: number; active: boolean; unread: number; onAccount: () => void; onNotifications: () => void; onActivity: () => void };
export function HomeCockpit(p: Props) {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning,' : hour < 18 ? 'Good afternoon,' : 'Good evening,';
  const circumference = 2 * Math.PI * 105;
  return <LinearGradient colors={['#0B3023', '#0E4A2D', '#072B1C']} style={s.hero}>
    <Svg pointerEvents="none" width="100%" height="100%" style={StyleSheet.absoluteFill}><Defs><RadialGradient id="field" cx="50%" cy="52%" rx="70%" ry="55%"><Stop offset="0" stopColor="#48AA4B" stopOpacity=".38" /><Stop offset="1" stopColor="#113821" stopOpacity="0" /></RadialGradient></Defs><Rect width="100%" height="100%" fill="url(#field)" /></Svg>
    <View style={s.header}><View style={s.nameBlock}><Text style={s.greeting}>{greeting}</Text><Text numberOfLines={1} style={s.name}>{p.name.split(' ')[0] || 'Welcome'}</Text></View><MotionPressable accessibilityLabel={`Notifications, ${p.unread} unread`} onPress={p.onNotifications} style={s.bell}><Ionicons name="notifications-outline" size={21} color="#FFFFFF" />{p.unread > 0 && <View style={s.dot} />}</MotionPressable><MotionPressable accessibilityLabel="Your account" onPress={p.onAccount} style={s.avatar}><ProfileAvatar avatarId={p.avatarId} photoUri={p.photoUri} uid={p.uid} size={46} rounded /></MotionPressable></View>
    <Reveal><MotionPressable accessibilityLabel={`Safety score ${p.score}. Open Drive Activity`} onPress={p.onActivity} style={s.score} scaleTo={.99}>
      <Svg width={252} height={252} viewBox="0 0 252 252" style={StyleSheet.absoluteFill}><Defs><SvgGradient id="score-light" x1="0" y1="0" x2="0" y2="1"><Stop offset="0" stopColor="#AEFF8B" /><Stop offset=".55" stopColor="#53DD63" /><Stop offset="1" stopColor="#168441" /></SvgGradient></Defs><Circle cx="126" cy="126" r="123" stroke="#83D978" strokeOpacity=".12" strokeWidth="1" fill="none" /><Circle cx="126" cy="126" r="105" stroke="#A5FF7A" strokeOpacity=".08" strokeWidth="22" fill="none" /><Circle cx="126" cy="126" r="105" stroke="#8BAF82" strokeOpacity=".22" strokeWidth="8" fill="none" /><Circle cx="126" cy="126" r="105" stroke="url(#score-light)" strokeWidth="11" fill="none" strokeLinecap="round" strokeDasharray={`${circumference} ${circumference}`} strokeDashoffset={circumference * (1 - Math.max(0, Math.min(100, p.score)) / 100)} rotation="-90" origin="126,126" /></Svg>
      <Text style={s.scoreValue}>{p.score}</Text><Text style={s.scoreLabel}>{p.measured ? 'Average safety score' : 'Starter safety score'}</Text><Ionicons name="shield-checkmark" size={25} color="#9AE784" style={{ marginTop: 14 }} />
    </MotionPressable></Reveal>
    <Text style={s.ready}>{p.active ? 'Drive monitoring active' : 'Ready for your next drive'}</Text>
  </LinearGradient>;
}
const s = StyleSheet.create({
  hero: { paddingHorizontal: 24, paddingTop: 22, paddingBottom: 54, minHeight: 422, alignItems: 'center' }, header: { flexDirection: 'row', alignItems: 'center', width: '100%', marginBottom: 8, gap: 8 }, nameBlock: { flex: 1 }, greeting: { color: '#D3E4D8', fontSize: 17, fontFamily: 'Manrope_400Regular' }, name: { color: '#FFFFFF', fontSize: 29, lineHeight: 36, fontFamily: 'Manrope_800ExtraBold', letterSpacing: -.7 }, bell: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }, dot: { position: 'absolute', top: 7, right: 9, width: 6, height: 6, borderRadius: 3, backgroundColor: '#B7F28C' }, avatar: { borderRadius: 25, borderWidth: 2, borderColor: 'rgba(255,255,255,.5)', overflow: 'hidden' }, score: { width: 252, height: 252, alignItems: 'center', justifyContent: 'center', paddingTop: 8 }, scoreValue: { color: '#FFFFFF', fontFamily: 'Manrope_800ExtraBold', fontSize: 68, lineHeight: 78, letterSpacing: -3, fontVariant: ['tabular-nums'] }, scoreLabel: { color: '#D4E9D6', fontFamily: 'Manrope_500Medium', fontSize: 13, marginTop: 4 }, ready: { color: '#FFFFFF', fontFamily: 'Manrope_700Bold', fontSize: 22, textAlign: 'center', letterSpacing: -.6, marginTop: 12 },
});
