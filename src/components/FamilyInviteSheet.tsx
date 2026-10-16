import { useState } from 'react';
import { Modal, KeyboardAvoidingView, Platform, Pressable, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MotionPressable } from './MotionPressable';
import { useAppearance } from '../theme/AppearanceContext';
import { useReducedMotion } from '../hooks/useReducedMotion';

export function FamilyInviteSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { colors: c } = useAppearance(); const reduced = useReducedMotion();
  const [kind, setKind] = useState<'email' | 'phone'>('email');
  const [contact, setContact] = useState(''); const [error, setError] = useState(''); const [sent, setSent] = useState(false);
  const close = () => { setContact(''); setError(''); setSent(false); onClose(); };
  const submit = () => {
    const valid = kind === 'email' ? /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.trim()) : /^\+?[0-9 ()-]{7,22}$/.test(contact) && contact.replace(/\D/g, '').length >= 7 && contact.replace(/\D/g, '').length <= 15;
    if (!valid) { setError(kind === 'email' ? 'Enter a valid email address.' : 'Enter a valid phone number with country code.'); return; }
    setError(''); setSent(true);
  };
  return <Modal transparent visible={visible} animationType={reduced ? 'none' : 'slide'} onRequestClose={close}>
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: '#00000066' }}>
      <Pressable accessibilityLabel="Close invite" onPress={close} style={{ position: 'absolute', inset: 0 }} />
      <View accessibilityViewIsModal style={{ backgroundColor: c.card, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 36, gap: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}><Text style={{ color: c.text, fontSize: 23, fontFamily: 'Manrope_800ExtraBold' }}>{sent ? 'Demo request created' : 'Invite family'}</Text><MotionPressable accessibilityLabel="Close invite" onPress={close} style={{ padding: 12 }}><Ionicons name="close" size={24} color={c.text} /></MotionPressable></View>
        <Text style={{ color: c.textSecondary, lineHeight: 21 }}>{sent ? 'No email or SMS was sent. In the connected version, they’ll receive an invitation and choose whether to join.' : 'Add someone by email or phone. Joining and sharing always require their approval.'}</Text>
        {!sent && <><View style={{ flexDirection: 'row', gap: 8 }}>{(['email', 'phone'] as const).map(value => <MotionPressable key={value} onPress={() => { setKind(value); setContact(''); setError(''); }} style={{ flex: 1, minHeight: 44, borderRadius: 12, backgroundColor: kind === value ? c.accentSoft : c.surfaceMuted, justifyContent: 'center', alignItems: 'center' }}><Text style={{ color: kind === value ? c.accent : c.text }}>{value === 'email' ? 'Email' : 'Phone'}</Text></MotionPressable>)}</View>
        <TextInput accessibilityLabel={kind === 'email' ? 'Family email address' : 'Family phone number'} value={contact} onChangeText={value => { setContact(kind === 'phone' ? value.replace(/[^0-9+ ()-]/g, '') : value); setError(''); }} autoCapitalize="none" autoCorrect={false} keyboardType={kind === 'email' ? 'email-address' : 'phone-pad'} placeholder={kind === 'email' ? 'name@example.com' : '+1 (555) 123-4567'} placeholderTextColor={c.textSecondary} maxLength={kind === 'email' ? 254 : 22} style={{ color: c.text, minHeight: 54, borderRadius: 14, borderWidth: 1, borderColor: error ? c.danger : c.borderStrong, paddingHorizontal: 16 }} />
        {!!error && <Text accessibilityRole="alert" style={{ color: c.danger }}>{error}</Text>}</>}
        <MotionPressable onPress={sent ? close : submit} style={{ minHeight: 54, borderRadius: 16, backgroundColor: c.accent, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: c.onAccent, fontFamily: 'Manrope_700Bold' }}>{sent ? 'Done' : 'Create demo invitation'}</Text></MotionPressable>
        {!sent && <Text style={{ color: c.textSecondary, fontSize: 12 }}>Demo only · Email and SMS delivery are not connected.</Text>}
      </View>
    </KeyboardAvoidingView>
  </Modal>;
}
