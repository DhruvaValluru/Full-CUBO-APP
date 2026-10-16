import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Text, TextInput, View } from 'react-native';
import { MotionPressable } from './MotionPressable';
import { InsurerLogo } from './InsurerLogo';
import { useAppearance } from '../theme/AppearanceContext';
export function DemoFamilyInsurance({ name, score }: { name: string; score: number }) {
  const { colors: c } = useAppearance(); const [stage, setStage] = useState<'idle' | 'confirm' | 'sending' | 'done'>('idle');
  const [typed, setTyped] = useState(''); const [error, setError] = useState(false); const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  const submit = () => { if (typed.trim().replace(/\s+/g, ' ').toLowerCase() !== name.toLowerCase()) { setError(true); return; } setStage('sending'); timer.current = setTimeout(() => setStage('done'), 800); };
  return <View style={{ backgroundColor: c.card, borderRadius: 24, padding: 20, gap: 14, borderWidth: 1, borderColor: c.border }}>
    <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}><InsurerLogo id="state-farm" /><View style={{ flex: 1 }}><Text style={{ color: c.text, fontSize: 18, fontFamily: 'Manrope_800ExtraBold' }}>Insurance report</Text><Text style={{ color: c.textSecondary, fontSize: 12 }}>State Farm · Sample provider</Text></View></View>
    <Text style={{ color: c.text, lineHeight: 21 }}>Monthly report · Safety score {score}/100</Text>
    <Text style={{ color: c.textSecondary, fontSize: 12, lineHeight: 19 }}>Simulation only. No insurer receives data. Real submissions would require this adult’s authorization.</Text>
    {stage === 'confirm' && <><Text style={{ color: c.textSecondary }}>Repeat the driver’s full name: {name}</Text><TextInput accessibilityLabel="Confirm driver name" value={typed} onChangeText={value => { setTyped(value); setError(false); }} placeholder="Full name" placeholderTextColor={c.textSecondary} style={{ minHeight: 50, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: error ? c.danger : c.borderStrong, color: c.text }} />{error && <Text accessibilityRole="alert" style={{ color: c.danger }}>Enter the driver’s name correctly: {name}.</Text>}</>}
    {stage === 'sending' ? <ActivityIndicator accessibilityLabel="Preparing demo report" color={c.accent} /> : stage === 'done' ? <Text accessibilityRole="alert" style={{ color: c.accent, fontFamily: 'Manrope_700Bold' }}>✓ Demo report complete · Nothing was sent</Text> : <MotionPressable onPress={stage === 'confirm' ? submit : () => setStage('confirm')} style={{ minHeight: 54, borderRadius: 16, backgroundColor: c.accent, justifyContent: 'center', alignItems: 'center', padding: 12 }}><Text style={{ color: c.onAccent, fontFamily: 'Manrope_700Bold' }}>{stage === 'confirm' ? 'Confirm demo submission' : 'Submit demo scores to State Farm'}</Text></MotionPressable>}
    {stage === 'confirm' && <MotionPressable onPress={() => { setStage('idle'); setTyped(''); setError(false); }} style={{ minHeight: 44, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: c.text }}>Cancel</Text></MotionPressable>}
  </View>;
}
