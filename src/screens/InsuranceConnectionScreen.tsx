import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Text, TextInput, View, StyleSheet } from 'react-native';
import { AppHeader } from '../components/AppHeader';
import { ScreenShell } from '../components/ScreenShell';
import { MotionPressable } from '../components/MotionPressable';
import { InsurerLogo } from '../components/InsurerLogo';
import { insuranceProviders, useInsurance } from '../features/insurance/InsuranceContext';
import { useProfile } from '../features/profile/ProfileContext';
import { useDrives } from '../features/drives/DriveContext';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { useAppearance } from '../theme/AppearanceContext';
import type { AppColors } from '../theme/colors';
import type { RootStackParamList } from '../navigation/types';

export function InsuranceConnectionScreen({ navigation }: NativeStackScreenProps<RootStackParamList, 'InsuranceConnection'>) {
  const { colors: c } = useAppearance(); const s = styles(c); const settings = useInsurance(); const { profile } = useProfile();
  const { sessions } = useDrives();
  const reportName = profile.name;
  const measured = sessions.filter(item => item.attentionMeasured);
  const score = measured.length ? Math.round(measured.reduce((total, item) => total + item.focusScore, 0) / measured.length) : 100;
  const miles = sessions.reduce((total, item) => total + item.distanceMiles, 0);
  const reduced = useReducedMotion(); const counter = useRef(new Animated.Value(0)).current;
  const [nameTouched, setNameTouched] = useState(false);
  const [amount, setAmount] = useState(0); const [name, setName] = useState('');
  const [stage, setStage] = useState<'idle' | 'confirm' | 'sending' | 'success'>('idle');
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const provider = insuranceProviders.find(p => p.id === settings.providerId);
  const selected = provider?.id === 'other' ? (settings.customProviderName?.trim() ? { ...provider, name: settings.customProviderName.trim() } : undefined) : provider;
  const normalize = (value: string) => value.trim().replace(/\s+/g, ' ').toLocaleLowerCase();
  const matches = !!reportName.trim() && normalize(name) === normalize(reportName);
  const cadence = settings.cadence === 'weekly' ? 'weekly' : 'monthly';
  useEffect(() => {
    const listener = counter.addListener(({ value }) => setAmount(Math.round(value)));
    const animation = Animated.timing(counter, { toValue: 324, duration: reduced ? 0 : 850, useNativeDriver: false }); animation.start();
    return () => { animation.stop(); counter.removeListener(listener); };
  }, [counter, reduced]);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  const reset = () => { setStage('idle'); setName(''); setNameTouched(false); };
  const submit = () => {
    setNameTouched(true);
    if (!matches || !selected || stage !== 'confirm') return;
    setStage('sending');
    timer.current = setTimeout(() => { settings.shareDemoReport(); setName(''); setStage('success'); }, 1000);
  };
  const busy = stage === 'sending';
  return <ScreenShell>
    <AppHeader title="Insurance" onBack={() => navigation.goBack()} />
    <Text style={s.copy}>Insurance preview · your saved driving summary</Text>
    <View style={s.savings}>
      <Text style={s.heroLabel}>Your safer driving could add up.</Text>
      <Text style={s.amount}>${amount}<Text style={s.per}> / year</Text></Text>
      <Text style={s.heroBody}>Illustrative premium savings</Text>
      <View style={s.rule} /><Text style={s.heroBody}>$180/month → $153/month · example 15% discount</Text>
      <Text style={s.disclaimer}>Example only. Your insurer determines eligibility and pricing. No discount is guaranteed.</Text>
    </View>
    <View style={s.metrics}>{[[String(score), measured.length ? 'Safety score' : 'Starter score'], [String(sessions.length), 'Saved trips'], [miles.toFixed(1), 'Saved miles']].map(([value, label]) => <View key={label} style={s.metric}><Text style={s.value}>{value}</Text><Text style={s.small}>{label}</Text></View>)}</View>
    <Text style={s.heading}>Your insurer</Text>
    <View style={s.providers}>{insuranceProviders.map(p => <MotionPressable key={p.id} disabled={busy} accessibilityRole="radio" accessibilityState={{ checked: settings.providerId === p.id }} style={[s.provider, settings.providerId === p.id && s.selected]} onPress={() => { settings.setProvider(p.id); reset(); }}><InsurerLogo id={p.id} /><Text style={[s.label, { flex: 1 }]}>{p.name}</Text><Ionicons name={settings.providerId === p.id ? 'checkmark-circle' : 'ellipse-outline'} color={settings.providerId === p.id ? c.accent : c.textSecondary} size={21} /></MotionPressable>)}</View>
    {settings.providerId === 'other' && <View style={{ gap: 8 }}><Text style={s.label}>Insurance company name</Text><TextInput accessibilityLabel="Insurance company name" editable={!busy} value={settings.customProviderName ?? ''} onChangeText={value => { settings.setCustomProviderName(value); reset(); }} placeholder="Enter your insurer" placeholderTextColor={c.textSecondary} maxLength={80} autoCapitalize="words" autoCorrect={false} style={s.input} /><Text style={s.small}>Enter a name to continue with your demo report.</Text></View>}
    <Text style={s.heading}>Driver reports</Text>
    <View style={s.segments}>{(['manual', 'automatic'] as const).map(mode => <MotionPressable key={mode} disabled={busy} accessibilityRole="radio" accessibilityState={{ checked: (settings.mode ?? 'manual') === mode }} style={[s.segment, (settings.mode ?? 'manual') === mode && s.segmentActive]} onPress={() => { settings.setMode(mode); reset(); }}><Text style={[s.label, (settings.mode ?? 'manual') === mode && { color: c.onAccent }]}>{mode === 'manual' ? 'Manual' : 'Automatic'}</Text></MotionPressable>)}</View>
    <Text style={s.copy}>{settings.mode === 'automatic' ? 'Preview recurring reports. Automatic delivery is simulated; nothing is sent in the background.' : 'Review and submit each demo report yourself.'}</Text>
    <View style={s.segments}>{(['weekly', 'monthly'] as const).map(period => <MotionPressable key={period} disabled={busy} accessibilityRole="radio" accessibilityState={{ checked: cadence === period }} style={[s.segment, cadence === period && s.selected]} onPress={() => { settings.setCadence(period); reset(); }}><Text style={s.label}>{period === 'monthly' ? 'Monthly' : 'Weekly'}</Text>{period === 'monthly' && <Text style={[s.small, { color: c.accent }]}>Recommended</Text>}</MotionPressable>)}</View>
    <Text style={s.copy}>Report includes the sample safety score, trip count and mileage. Camera frames and precise routes are excluded.</Text>
    {stage === 'idle' && <MotionPressable disabled={!selected} style={[s.button, !selected && s.disabled]} onPress={() => { setName(''); setStage('confirm'); }}><Text style={s.buttonText}>Submit driver report to {selected?.name ?? 'your insurer'}</Text><Ionicons name="arrow-forward" size={19} color={c.onAccent} /></MotionPressable>}
    {stage === 'confirm' && <View style={s.confirm}><Text style={s.heading}>Confirm your demo report</Text><Text style={s.copy}>{selected?.name} · {cadence} · {settings.mode ?? 'manual'}</Text><Text style={s.copy}>Type the driver’s full name to confirm: {reportName}</Text><TextInput accessibilityLabel="Repeat your full name" value={name} onChangeText={setName} onBlur={() => setNameTouched(true)} placeholder="Your full name" placeholderTextColor={c.textSecondary} autoCapitalize="words" autoCorrect={false} style={[s.input, nameTouched && !matches && { borderColor: c.danger }]} />{nameTouched && !matches && <Text accessibilityRole="alert" style={{ color: c.danger, fontSize: 13, lineHeight: 19 }}>Please enter the driver’s name correctly: {reportName}.</Text>}<Text style={s.small}>This confirms a simulation. No information will reach an insurer.</Text><MotionPressable style={s.button} onPress={submit}><Text style={s.buttonText}>Confirm & submit demo scores</Text></MotionPressable><MotionPressable style={s.cancel} onPress={reset}><Text style={s.label}>Cancel</Text></MotionPressable></View>}
    {busy && <View accessibilityRole="progressbar" style={s.confirm}><ActivityIndicator color={c.accent} /><Text style={s.label}>Preparing your demo report…</Text></View>}
    {stage === 'success' && <View accessibilityLiveRegion="polite" style={s.confirm}><Ionicons name="checkmark-circle" size={40} color={c.accent} /><Text style={s.heading}>Demo scores submitted</Text><Text style={s.copy}>Simulation complete for {selected?.name}. No report was sent and no premium changed.</Text><Text style={s.small}>{settings.mode === 'automatic' ? `Automatic ${cadence} reporting selected for the demo.` : 'Manual reporting selected.'}</Text><MotionPressable style={s.cancel} onPress={reset}><Text style={s.label}>Back to report settings</Text></MotionPressable></View>}
  </ScreenShell>;
}
const styles = (c: AppColors) => StyleSheet.create({
  copy: { color: c.textSecondary, fontSize: 13, lineHeight: 20 }, small: { color: c.textSecondary, fontSize: 11, lineHeight: 17 },
  savings: { backgroundColor: '#183D2D', borderRadius: 24, padding: 24, gap: 8 }, heroLabel: { color: '#FFFFFF', fontFamily: 'Manrope_700Bold', fontSize: 18 }, amount: { color: '#FFFFFF', fontFamily: 'Manrope_800ExtraBold', fontSize: 56, fontVariant: ['tabular-nums'] }, per: { fontSize: 16, color: '#C8DFD2' }, heroBody: { color: '#E0EDE5', fontSize: 13, lineHeight: 20 }, disclaimer: { color: '#C8DFD2', fontSize: 11, lineHeight: 17 }, rule: { height: 1, backgroundColor: '#466252', marginVertical: 8 },
  metrics: { flexDirection: 'row', paddingVertical: 16, borderBottomWidth: 1, borderColor: c.border }, metric: { flex: 1, alignItems: 'center', gap: 4 }, value: { fontFamily: 'Manrope_800ExtraBold', fontSize: 24, color: c.text }, heading: { color: c.text, fontFamily: 'Manrope_800ExtraBold', fontSize: 19, marginTop: 12, marginBottom: 4 },
  providers: { gap: 8 }, provider: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 16, borderWidth: 1, borderColor: c.border, backgroundColor: c.card }, selected: { backgroundColor: c.accentSoft, borderColor: c.accent, borderWidth: 1 }, label: { color: c.text, fontFamily: 'Manrope_700Bold', fontSize: 13 }, segments: { flexDirection: 'row', gap: 8, paddingVertical: 4 }, segment: { flex: 1, minHeight: 56, borderRadius: 14, justifyContent: 'center', alignItems: 'center', backgroundColor: c.card, borderWidth: 1, borderColor: c.border }, segmentActive: { backgroundColor: c.accent, borderColor: c.accent },
  button: { minHeight: 56, borderRadius: 16, backgroundColor: c.accent, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 12 }, buttonText: { color: c.onAccent, fontFamily: 'Manrope_800ExtraBold', fontSize: 13, flexShrink: 1, textAlign: 'center' }, disabled: { opacity: .4 }, confirm: { backgroundColor: c.card, borderWidth: 1, borderColor: c.borderStrong, borderRadius: 20, padding: 20, gap: 12 }, input: { minHeight: 52, paddingHorizontal: 14, borderRadius: 12, borderWidth: 1, borderColor: c.borderStrong, backgroundColor: c.background, color: c.text, fontSize: 15 }, cancel: { minHeight: 44, justifyContent: 'center', alignItems: 'center' },
});
