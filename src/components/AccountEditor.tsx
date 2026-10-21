import { useEffect, useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { useAuth } from '../features/auth/AuthContext';
import { useConnections } from '../features/connections/ConnectionContext';
import { makeAccountDetails } from '../features/auth/accountDetails';
import { formatBirthInput, formatPhoneInput, internationalPhone, phoneCountries, phoneDigits } from '../features/auth/inputFormatting';
import { MotionPressable } from './MotionPressable';
import { useAppearance } from '../theme/AppearanceContext';
import type { AppColors } from '../theme/colors';

export function AccountEditor() {
  const { colors: c } = useAppearance();
  const s = makeThemeStyles(c);

  const reduced = useReducedMotion();
  const account = useAuth(); const connections = useConnections();
  const [birth, setBirth] = useState(''); const [digits, setDigits] = useState(''); const [country, setCountry] = useState<(typeof phoneCountries)[number]>(phoneCountries[0]); const [countriesOpen, setCountriesOpen] = useState(false);
  const [email, setEmail] = useState(account.user?.email ?? ''); const [currentPassword, setCurrentPassword] = useState(''); const [password, setPassword] = useState(''); const [repeat, setRepeat] = useState('');
  const [security, setSecurity] = useState(false); const [busy, setBusy] = useState(false); const [message, setMessage] = useState(''); const [failed, setFailed] = useState(false);
  useFocusEffect(useCallback(() => {
    setEmail(account.user?.email ?? ''); setCurrentPassword(''); setPassword(''); setRepeat(''); setSecurity(false); setMessage(''); setFailed(false); setCountriesOpen(false);
    const details = account.accountDetails; if (!details) { setBirth(''); setDigits(''); setCountry(phoneCountries[0]); return; }
    const [year, month, day] = details.birthDate.split('-'); setBirth(month + '/' + day + '/' + year);
    const code = [...phoneCountries].sort((a, b) => b.code.length - a.code.length).find(item => details.phoneNumber.startsWith('+' + item.code)) ?? phoneCountries[0];
    setCountry(code); setDigits(phoneDigits(details.phoneNumber, code.code));
  }, [account.accountDetails?.birthDate, account.accountDetails?.phoneNumber, account.user?.email]));
  const run = async (action: () => Promise<string>) => {
    if (busy) return; setBusy(true); setMessage(''); setFailed(false);
    try { setMessage(await action()); }
    catch (error) { setFailed(true); const code = (error as { code?: string }).code; setMessage(code === 'auth/invalid-credential' ? 'Current password is incorrect. Please try again.' : code === 'auth/credential-already-in-use' || code === 'auth/account-exists-with-different-credential' ? 'That Google account is already linked to another CUBO account.' : code === 'auth/popup-closed-by-user' ? 'Google linking was canceled. Your account is unchanged.' : code === 'permission-denied' ? 'Firebase rejected this save. Sign in again and retry; your previous details are unchanged.' : code === 'auth/too-many-requests' ? 'Too many attempts. Wait a little and try again.' : error instanceof Error ? error.message : 'Could not save this change.'); }
    finally { setBusy(false); setCurrentPassword(''); setPassword(''); setRepeat(''); }
  };
  const saveDetails = () => run(async () => {
    const details = makeAccountDetails(birth, internationalPhone(digits, country.code));
    const changesBirth = details.birthDate !== account.accountDetails?.birthDate;
    const linkedMinor = connections.connections.some(item => item.kind === 'family' && item.memberUid === account.user?.uid && item.memberAccountType === 'minor');
    if (linkedMinor && changesBirth) {
      if (account.accountDetails && details.phoneNumber !== account.accountDetails.phoneNumber) await account.saveAccountDetails({ ...account.accountDetails, phoneNumber: details.phoneNumber });
      await connections.requestBirthDateChange(details);
      return 'Birth-date change requested. Your family organizer can approve or deny it.';
    }
    await account.saveAccountDetails(details);
    return 'Updated!';
  });
  const linkedMinor = connections.connections.some(item => item.kind === 'family' && item.memberUid === account.user?.uid && item.memberAccountType === 'minor');
  const birthRequest = connections.birthDateRequests.find(item => item.minorUid === account.user?.uid);
  const savedBirth = account.accountDetails ? (() => { const [year, month, day] = account.accountDetails.birthDate.split('-'); return `${month}/${day}/${year}`; })() : '';
  const requestingBirthChange = linkedMinor && birth.length === 10 && birth !== savedBirth;
  useEffect(() => {
    if (birthRequest?.status !== 'pending') return;
    const [year, month, day] = birthRequest.requestedBirthDate.split('-');
    setBirth(`${month}/${day}/${year}`);
  }, [birthRequest?.requestedBirthDate, birthRequest?.status]);
  const hasPassword = account.user?.providerData.some(provider => provider.providerId === 'password') ?? false;
  const flag = (region: string) => String.fromCodePoint(...[...region].map(letter => 127397 + letter.charCodeAt(0)));
  return <View style={s.section}>
    <Text style={s.heading}>Account Details</Text>
    <Text style={s.body}>Your birth date determines your minor or adult account. It is self-declared, not identity verification.</Text>
    <View style={s.labelRow}><Text style={s.label}>Date of birth</Text>{linkedMinor ? <View style={s.editableBadge}><Ionicons name="pencil-outline" size={12} color={c.accent} /><Text style={s.editableText}>Editable request</Text></View> : null}</View><TextInput editable accessibilityLabel="Date of birth" placeholder="MM/DD/YYYY" placeholderTextColor={c.textSecondary} keyboardType="number-pad" maxLength={10} value={birth} onChangeText={value => { setMessage(''); setBirth(formatBirthInput(value, birth)); }} style={s.input} />
    {linkedMinor ? <Text style={s.body}>Edit the date above and save to send a pending change request. Your current saved birth date stays the same until your family organizer approves it.</Text> : null}
    {linkedMinor && birthRequest ? <View style={s.requestStatus}><Ionicons name={birthRequest.status === 'pending' ? 'time-outline' : birthRequest.status === 'approved' ? 'checkmark-circle-outline' : 'close-circle-outline'} size={18} color={birthRequest.status === 'denied' ? c.danger : c.accent} /><View style={{ flex: 1 }}><Text style={s.requestTitle}>{birthRequest.status === 'pending' ? 'Waiting for organizer approval' : birthRequest.status === 'approved' ? 'Birth-date change approved' : 'Birth-date change denied'}</Text><Text style={s.body}>Requested date: {birthRequest.requestedBirthDate}</Text></View></View> : null}
    <Text style={s.label}>Phone number (optional)</Text><View style={s.phone}><MotionPressable accessibilityLabel="Select phone country" style={s.country} onPress={() => setCountriesOpen(true)}><Text style={s.countryText}>{flag(country.region)} +{country.code}</Text><Ionicons name="chevron-down" size={14} color={c.textSecondary} /></MotionPressable><TextInput accessibilityLabel="Phone number (optional)" keyboardType="phone-pad" value={formatPhoneInput(digits, country.code)} onChangeText={value => { setMessage(''); setDigits(phoneDigits(value, country.code)); }} placeholder={country.code === '1' ? '(919) 555-0123' : 'Phone number'} placeholderTextColor={c.textSecondary} style={[s.input, s.phoneInput]} /></View>
    <MotionPressable disabled={busy} style={[s.button, busy && s.disabled]} onPress={() => void saveDetails()}><Text style={s.white}>{busy ? 'Saving…' : message.startsWith('Updated!') && !failed ? 'Updated!' : requestingBirthChange ? birthRequest?.status === 'pending' ? 'Update Pending Request' : 'Send Change Request' : 'Save Account Details'}</Text></MotionPressable>
    <MotionPressable accessibilityState={{ expanded: security }} style={s.securityRow} onPress={() => setSecurity(value => !value)}><Ionicons name="lock-closed-outline" size={21} color={c.accent} /><View style={{ flex: 1 }}><Text style={s.heading}>Email & password</Text><Text style={s.body}>Confirm changes with your current password.</Text></View><Ionicons name={security ? 'chevron-up' : 'chevron-down'} size={18} color={c.textSecondary} /></MotionPressable>
    {security ? <View style={s.security}>
      <Text style={s.label}>Current password</Text><TextInput accessibilityLabel="Current password" autoCapitalize="none" autoCorrect={false} secureTextEntry value={currentPassword} onChangeText={setCurrentPassword} style={s.input} />
      <Text style={s.label}>Email address</Text><TextInput accessibilityLabel="Email address" autoCapitalize="none" autoCorrect={false} keyboardType="email-address" value={email} onChangeText={setEmail} style={s.input} />
      <Text style={s.body}>Your email changes only after you open the verification link sent to the new address.</Text>
      <MotionPressable disabled={busy || email.trim().toLowerCase() === account.user?.email?.toLowerCase()} style={s.outline} onPress={() => void run(async () => { await account.changeEmail(email, currentPassword); return 'Verification link sent to your new email. Open it to complete the change.'; })}><Text style={s.green}>Verify new email</Text></MotionPressable>
      <Text style={s.label}>New password</Text><TextInput accessibilityLabel="New password" autoCapitalize="none" autoCorrect={false} secureTextEntry value={password} onChangeText={setPassword} style={s.input} placeholder="At least 8 characters" placeholderTextColor={c.textSecondary} />
      <Text style={s.label}>Confirm new password</Text><TextInput accessibilityLabel="Confirm new password" autoCapitalize="none" autoCorrect={false} secureTextEntry value={repeat} onChangeText={setRepeat} style={s.input} />
      <MotionPressable disabled={busy} style={s.outline} onPress={() => void run(async () => { if (password !== repeat) throw Error('New passwords do not match.'); await account.changePassword(password, currentPassword); return 'Password updated securely.'; })}><Text style={s.green}>Update password</Text></MotionPressable>
    </View> : null}
    {hasPassword ? <View style={s.googleCard}><View style={s.googleIcon}><Ionicons name="logo-google" size={20} color={c.accent} /></View><View style={{ flex: 1 }}><Text style={s.requestTitle}>{account.googleLinked ? 'Google account linked' : 'Link your Google account'}</Text><Text style={s.body}>{account.googleLinked ? 'You can sign in with Google or your email and password.' : 'Keep this same CUBO account and add Google as another secure sign-in option.'}</Text></View>{account.googleLinked ? <Ionicons name="checkmark-circle" size={22} color={c.accent} /> : <MotionPressable disabled={busy} style={s.linkButton} onPress={() => void run(async () => { await account.linkGoogleAccount(); return 'Google account linked. You can now use either sign-in method.'; })}><Text style={s.green}>Link</Text></MotionPressable>}</View> : null}
    {message && message !== 'Updated!' ? <Text accessibilityRole="alert" style={[s.body, { color: failed ? c.danger : c.accent }]}>{message}</Text> : null}
    <Modal transparent visible={countriesOpen} animationType={reduced ? 'none' : 'slide'} onRequestClose={() => setCountriesOpen(false)}><View style={s.modal}><Pressable style={StyleSheet.absoluteFill} onPress={() => setCountriesOpen(false)} accessibilityLabel="Close country selector" /><View style={s.countrySheet}><Text style={s.heading}>Country calling code</Text>{phoneCountries.map(item => <MotionPressable key={item.region} style={s.countryChoice} onPress={() => { setMessage(''); setCountry(item); setDigits(''); setCountriesOpen(false); }}><Text style={s.countryText}>{flag(item.region)} {item.name}</Text><Text style={s.green}>+{item.code}</Text></MotionPressable>)}</View></View></Modal>
  </View>;
}
const makeThemeStyles = (c: AppColors) => StyleSheet.create({ section: { marginTop: 24, gap: 12 }, heading: { color: c.text, fontSize: 18, fontFamily: 'Manrope_700Bold' }, body: { color: c.textSecondary, fontSize: 12, lineHeight: 19 }, labelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }, label: { color: c.text, fontSize: 12, fontFamily: 'Manrope_700Bold', marginTop: 8 }, editableBadge: { flexDirection: 'row', gap: 5, alignItems: 'center', borderRadius: 10, paddingHorizontal: 8, minHeight: 26, backgroundColor: c.accentSoft }, editableText: { color: c.accent, fontSize: 10, fontFamily: 'Manrope_700Bold' }, input: { minHeight: 52, backgroundColor: c.card, borderRadius: 14, borderWidth: 1, borderColor: c.border, paddingHorizontal: 14, color: c.text, fontSize: 15 }, phone: { flexDirection: 'row', gap: 8 }, phoneInput: { flex: 1, minWidth: 0 }, country: { minHeight: 52, flexDirection: 'row', gap: 6, alignItems: 'center', paddingHorizontal: 12, borderRadius: 14, backgroundColor: c.surfaceMuted }, countryText: { color: c.text, fontSize: 13 }, button: { minHeight: 52, borderRadius: 16, backgroundColor: c.accent, justifyContent: 'center', alignItems: 'center', marginTop: 8 }, white: { color: c.onAccent, fontFamily: 'Manrope_700Bold', fontSize: 14 }, green: { color: c.accent, fontFamily: 'Manrope_700Bold', fontSize: 13 }, outline: { minHeight: 48, borderRadius: 14, borderWidth: 1, borderColor: c.border, backgroundColor: c.accentSoft, justifyContent: 'center', alignItems: 'center' }, disabled: { opacity: .5 }, securityRow: { flexDirection: 'row', gap: 12, alignItems: 'center', minHeight: 72, marginTop: 16, borderTopWidth: 1, borderColor: c.border, paddingTop: 16 }, security: { gap: 12 }, requestStatus: { flexDirection: 'row', gap: 10, alignItems: 'center', borderRadius: 14, padding: 12, backgroundColor: c.accentSoft, borderWidth: 1, borderColor: c.border }, requestTitle: { color: c.text, fontFamily: 'Manrope_700Bold', fontSize: 13 }, googleCard: { minHeight: 78, flexDirection: 'row', gap: 12, alignItems: 'center', borderRadius: 18, padding: 14, backgroundColor: c.card, borderWidth: 1, borderColor: c.borderStrong }, googleIcon: { width: 42, height: 42, borderRadius: 14, backgroundColor: c.accentSoft, alignItems: 'center', justifyContent: 'center' }, linkButton: { minWidth: 58, minHeight: 42, borderRadius: 13, backgroundColor: c.accentSoft, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12 }, modal: { flex: 1, justifyContent: 'flex-end', backgroundColor: '#12291C66' }, countrySheet: { backgroundColor: c.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 32 }, countryChoice: { minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: StyleSheet.hairlineWidth, borderColor: c.border } });
