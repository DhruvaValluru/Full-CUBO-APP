import { useState } from 'react';
import { Platform, StyleSheet, Text, TextInput, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../features/auth/AuthContext';
import { familyApiConfigured, familyRequest } from '../features/family/familyApi';
import { MotionPressable } from './MotionPressable';
import { useAppearance } from '../theme/AppearanceContext';
import type { AppColors } from '../theme/colors';

export function FeedbackForm() {
  const { colors: c } = useAppearance();
  const s = makeThemeStyles(c);

  const { user } = useAuth(); const [kind, setKind] = useState<'bug' | 'feedback'>('bug'); const [subject, setSubject] = useState(''); const [message, setMessage] = useState(''); const [status, setStatus] = useState(''); const [busy, setBusy] = useState(false);
  const submit = async () => {
    if (busy) return;
    if (subject.trim().length < 3 || message.trim().length < 10) { setStatus('Add a subject and at least 10 characters describing what happened.'); return; }
    if (!user) { setStatus('Sign in before saving feedback.'); return; }
    setBusy(true); setStatus('');
    try {
      const payload = { kind, subject: subject.trim(), message: message.trim(), platform: Platform.OS };
      if (familyApiConfigured) {
        const result = await familyRequest<{ id: string; emailDelivery: string }>('/support/feedback', payload);
        setStatus(result.emailDelivery === 'sent' ? 'Feedback sent to the team. Thank you.' : 'Feedback saved to the server. Email delivery is not connected or did not complete.');
      } else {
        const key = 'cubo-feedback-drafts:' + user.uid; const stored = await AsyncStorage.getItem(key); const previous = stored ? JSON.parse(stored) : [];
        await AsyncStorage.setItem(key, JSON.stringify([{ ...payload, id: 'feedback-' + Date.now(), createdAt: new Date().toISOString(), emailDelivery: 'not-configured' }, ...previous].slice(0, 20)));
        setStatus('Saved on this device—not emailed. The team email service will be connected later.');
      }
      setSubject(''); setMessage('');
    } catch { setStatus('Could not save feedback. Your text is still here; please try again.'); }
    finally { setBusy(false); }
  };
  return <View style={s.form}><View style={s.tabs}>{(['bug', 'feedback'] as const).map(value => <MotionPressable key={value} accessibilityState={{ selected: kind === value }} style={[s.tab, kind === value && s.active]} onPress={() => setKind(value)}><Text style={[s.label, kind === value && { color: c.accent }]}>{value === 'bug' ? 'Report a bug' : 'Share feedback'}</Text></MotionPressable>)}</View><Text style={s.label}>Subject</Text><TextInput accessibilityLabel="Feedback subject" style={s.input} placeholder={kind === 'bug' ? 'What needs our attention?' : 'What would make CUBO better?'} placeholderTextColor={c.textSecondary} maxLength={160} value={subject} onChangeText={setSubject} /><Text style={s.label}>Details</Text><TextInput accessibilityLabel="Feedback details" style={[s.input, s.details]} multiline textAlignVertical="top" placeholder={kind === 'bug' ? 'Tell us what happened and how to reproduce it. Please don’t include passwords or sensitive information.' : 'Share your idea, what you like, or what we could improve. Please don’t include sensitive information.'} placeholderTextColor={c.textSecondary} maxLength={4000} value={message} onChangeText={setMessage} /><Text style={s.body}>Includes your device platform, not camera footage or location.</Text><MotionPressable disabled={busy} style={[s.submit, busy && { opacity: .5 }]} onPress={() => void submit()}><Text style={s.white}>{busy ? 'Saving…' : 'Submit feedback'}</Text></MotionPressable>{status ? <Text accessibilityRole="alert" style={s.body}>{status}</Text> : null}</View>;
}
const makeThemeStyles = (c: AppColors) => StyleSheet.create({ form: { gap: 12, marginTop: 20 }, tabs: { flexDirection: 'row', borderRadius: 16, padding: 4, backgroundColor: c.surfaceMuted }, tab: { flex: 1, minHeight: 46, justifyContent: 'center', alignItems: 'center', borderRadius: 12 }, active: { backgroundColor: c.card }, label: { color: c.text, fontFamily: 'Manrope_700Bold', fontSize: 13 }, input: { minHeight: 52, borderWidth: 1, borderColor: c.border, backgroundColor: c.card, borderRadius: 14, padding: 14, color: c.text, fontSize: 14 }, details: { minHeight: 170, lineHeight: 21 }, body: { color: c.textSecondary, fontSize: 12, lineHeight: 19 }, submit: { minHeight: 52, borderRadius: 16, backgroundColor: c.accent, alignItems: 'center', justifyContent: 'center' }, white: { color: c.onAccent, fontFamily: 'Manrope_700Bold', fontSize: 14 } });
