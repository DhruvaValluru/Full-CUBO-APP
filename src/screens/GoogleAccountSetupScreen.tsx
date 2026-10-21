import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useMemo, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { makeAccountDetails, parseBirthDate } from '../features/auth/accountDetails';
import { useAuth } from '../features/auth/AuthContext';
import { formatBirthInput, formatPhoneInput, internationalPhone, phoneCountries, phoneDigits } from '../features/auth/inputFormatting';
import { useAppearance } from '../theme/AppearanceContext';
import { authTheme } from '../theme/authTheme';

export function GoogleAccountSetupScreen() {
  const account = useAuth();
  const { colors, mode } = useAppearance();
  const palette = useMemo(() => authTheme(colors, mode), [colors, mode]);
  const styles = useMemo(() => makeStyles(palette), [palette]);
  const [name, setName] = useState(account.user?.displayName?.trim() ?? '');
  const [phone, setPhone] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [country, setCountry] = useState<{ name: string; region: string; code: string }>(phoneCountries[0]);
  const [countryPicker, setCountryPicker] = useState(false);
  const [customCode, setCustomCode] = useState('');
  const [focused, setFocused] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    setMessage('');
    try {
      const details = makeAccountDetails(birthDate, internationalPhone(phone, country.code));
      await account.completeGoogleAccountSetup(name, details);
    } catch (cause) {
      setMessage(cause instanceof Error ? cause.message : 'CUBO could not finish creating your account.');
    } finally {
      setBusy(false);
    }
  };

  return <LinearGradient colors={palette.gradient} locations={[0, .36, 1]} style={styles.screen}>
    <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />
    <Modal visible={countryPicker} transparent animationType="fade" onRequestClose={() => setCountryPicker(false)}>
      <View style={styles.pickerBackdrop}><Pressable accessibilityLabel="Close country selector" style={StyleSheet.absoluteFill} onPress={() => setCountryPicker(false)} /><SafeAreaView style={styles.pickerSheet}>
        <View style={styles.pickerHeader}><Text style={styles.pickerTitle}>Country calling code</Text><Pressable accessibilityRole="button" accessibilityLabel="Close country selector" style={styles.close} onPress={() => setCountryPicker(false)}><Ionicons name="close" size={22} color={palette.text} /></Pressable></View>
        <ScrollView keyboardShouldPersistTaps="handled">{phoneCountries.map(item => <Pressable accessibilityRole="button" key={item.region} style={styles.countryOption} onPress={() => { setCountry(item); setPhone(value => phoneDigits(value, item.code)); setCountryPicker(false); }}><Text style={styles.optionText}>{item.name}</Text><Text style={styles.optionCode}>+{item.code}</Text>{country.region === item.region ? <Ionicons name="checkmark" size={20} color={palette.accent} /> : null}</Pressable>)}
          <Text style={styles.customLabel}>Other country calling code</Text><View style={styles.customRow}><Text style={styles.optionText}>+</Text><TextInput accessibilityLabel="Other country calling code" keyboardType="number-pad" maxLength={3} value={customCode} onChangeText={value => setCustomCode(value.replace(/\D/g, ''))} placeholder="Code" placeholderTextColor={palette.textSecondary} style={styles.customInput} /><Pressable accessibilityRole="button" disabled={!/^[1-9]\d{0,2}$/.test(customCode)} style={[styles.useCode, !/^[1-9]\d{0,2}$/.test(customCode) && styles.disabled]} onPress={() => { setCountry({ name: 'Other country', region: '', code: customCode }); setPhone(value => phoneDigits(value, customCode)); setCountryPicker(false); }}><Text style={styles.useCodeText}>Use code</Text></Pressable></View>
        </ScrollView>
      </SafeAreaView></View>
    </Modal>
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.safe}>
        <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
          <View style={styles.brandMark}><Ionicons name="shield-checkmark" size={22} color={palette.accent} /></View>
          <Text style={styles.eyebrow}>GOOGLE SIGN-UP</Text>
          <Text style={styles.title}>Continue account creation</Text>
          <Text style={styles.subtitle}>Google sign-in is complete. Add the last few details CUBO needs for your profile and age-appropriate features.</Text>
          <View style={styles.googleAccount}><Ionicons name="logo-google" size={18} color={palette.text} /><View style={styles.accountCopy}><Text style={styles.accountLabel}>Signed in with Google</Text><Text numberOfLines={1} style={styles.accountEmail}>{account.user?.email}</Text></View><Ionicons name="checkmark-circle" size={21} color={palette.accent} /></View>

          <View style={styles.fields}>
            <View style={styles.field}><Text style={styles.label}>Name</Text><TextInput accessibilityLabel="Name" autoCapitalize="words" autoComplete="name" value={name} onChangeText={value => { setName(value); setMessage(''); }} onFocus={() => setFocused('name')} onBlur={() => setFocused(null)} placeholder="Your name" placeholderTextColor={palette.textSecondary} selectionColor={palette.accent} style={[styles.input, focused === 'name' && styles.inputFocused]} /></View>
            <View style={styles.field}><Text style={styles.label}>Phone number</Text><View style={styles.phoneRow}><Pressable accessibilityRole="button" accessibilityLabel={`Country calling code: ${country.name}, +${country.code}`} style={styles.countryButton} onPress={() => setCountryPicker(true)}><Text style={styles.countryText}>{country.region} +{country.code}</Text><Ionicons name="chevron-down" size={14} color={palette.textSecondary} /></Pressable><TextInput accessibilityLabel="Phone number" autoComplete="tel-national" keyboardType="phone-pad" value={formatPhoneInput(phone, country.code)} onChangeText={value => { setPhone(phoneDigits(value, country.code)); setMessage(''); }} onFocus={() => setFocused('phone')} onBlur={() => setFocused(null)} placeholder={country.code === '1' ? '(919) 555-0123' : 'Phone number'} placeholderTextColor={palette.textSecondary} selectionColor={palette.accent} style={[styles.input, styles.phoneInput, focused === 'phone' && styles.inputFocused]} /></View></View>
            <View style={styles.field}><Text style={styles.label}>Date of birth</Text><TextInput accessibilityLabel="Date of birth, month day year" keyboardType="number-pad" value={birthDate} onChangeText={value => { setBirthDate(previous => formatBirthInput(value, previous)); setMessage(''); }} onFocus={() => setFocused('birth')} onBlur={() => { setFocused(null); if (!birthDate) return; try { parseBirthDate(birthDate); } catch (cause) { setMessage(cause instanceof Error ? cause.message : 'Enter a valid birth date.'); } }} placeholder="MM/DD/YYYY" maxLength={10} placeholderTextColor={palette.textSecondary} selectionColor={palette.accent} style={[styles.input, focused === 'birth' && styles.inputFocused]} /><Text style={styles.helper}>Used to set up adult or minor account features. Age is self-declared.</Text></View>
          </View>

          {message ? <Text accessibilityRole="alert" style={styles.error}>{message}</Text> : null}
          <Pressable accessibilityRole="button" disabled={busy} onPress={() => void submit()} style={({ pressed }) => [styles.submit, pressed && styles.submitPressed, busy && styles.disabled]}>{busy ? <ActivityIndicator color={palette.onAccent} /> : <><Text style={styles.submitText}>Continue</Text><Ionicons name="arrow-forward" size={19} color={palette.onAccent} /></>}</Pressable>
          <Pressable accessibilityRole="button" disabled={busy} onPress={() => void account.signOut()} style={styles.different}><Text style={styles.differentText}>Use a different account</Text></Pressable>
          <Text style={styles.privacy}>Your phone number and birth date stay in your private CUBO account and are not shown to other users.</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  </LinearGradient>;
}

const makeStyles = (c: ReturnType<typeof authTheme>) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: c.background }, safe: { flex: 1 },
  content: { flexGrow: 1, width: '100%', maxWidth: 480, alignSelf: 'center', paddingHorizontal: 28, paddingTop: 28, paddingBottom: 32 },
  brandMark: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: c.accentSoft, borderWidth: 1, borderColor: c.borderStrong, marginBottom: 20 },
  eyebrow: { color: c.accent, fontFamily: 'Manrope_700Bold', fontSize: 11, letterSpacing: 1.5, marginBottom: 8 },
  title: { color: c.text, fontFamily: 'Manrope_800ExtraBold', fontSize: 36, lineHeight: 40, letterSpacing: -1.1, maxWidth: 390 },
  subtitle: { color: c.textSecondary, fontFamily: 'Manrope_400Regular', fontSize: 14, lineHeight: 21, marginTop: 12 },
  googleAccount: { minHeight: 64, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, marginTop: 24, borderRadius: 16, borderWidth: 1, borderColor: c.borderStrong, backgroundColor: c.card },
  accountCopy: { flex: 1, minWidth: 0 }, accountLabel: { color: c.text, fontFamily: 'Manrope_600SemiBold', fontSize: 13 }, accountEmail: { color: c.textSecondary, fontSize: 12, marginTop: 2 },
  fields: { gap: 20, marginTop: 28 }, field: { gap: 7 }, label: { color: c.text, fontFamily: 'Manrope_600SemiBold', fontSize: 13 },
  input: { minHeight: 52, borderWidth: 1, borderRadius: 12, borderColor: c.fieldBorder, backgroundColor: c.card, color: c.text, fontFamily: 'Manrope_500Medium', fontSize: 16, paddingHorizontal: 14, paddingVertical: 12 },
  inputFocused: { borderColor: c.accent, borderWidth: 2 }, phoneRow: { flexDirection: 'row', gap: 12, alignItems: 'center' }, phoneInput: { flex: 1, minWidth: 0 },
  countryButton: { minHeight: 52, flexDirection: 'row', gap: 8, alignItems: 'center', paddingHorizontal: 12, borderRadius: 12, borderWidth: 1, borderColor: c.fieldBorder, backgroundColor: c.card }, countryText: { color: c.text, fontSize: 13, fontFamily: 'Manrope_600SemiBold' },
  helper: { color: c.textSecondary, fontSize: 11, lineHeight: 17 }, error: { color: c.errorText, fontSize: 12, lineHeight: 18, marginTop: 16 },
  submit: { minHeight: 54, flexDirection: 'row', gap: 10, alignItems: 'center', justifyContent: 'center', borderRadius: 16, backgroundColor: c.accent, marginTop: 24 }, submitPressed: { opacity: .9, transform: [{ scale: .99 }] }, submitText: { color: c.onAccent, fontFamily: 'Manrope_700Bold', fontSize: 15 }, disabled: { opacity: .55 },
  different: { minHeight: 48, alignItems: 'center', justifyContent: 'center', marginTop: 8 }, differentText: { color: c.accent, fontFamily: 'Manrope_600SemiBold', fontSize: 13 }, privacy: { color: c.textSecondary, fontSize: 11, lineHeight: 17, textAlign: 'center', marginTop: 10 },
  pickerBackdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,.4)' }, pickerSheet: { backgroundColor: c.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 24, paddingBottom: 24, maxHeight: '75%' }, pickerHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 12, paddingBottom: 8 }, pickerTitle: { color: c.text, fontSize: 18, fontFamily: 'Manrope_700Bold' }, close: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }, countryOption: { flexDirection: 'row', gap: 12, minHeight: 48, alignItems: 'center', borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: c.border }, optionText: { flex: 1, color: c.text, fontSize: 15 }, optionCode: { color: c.textSecondary, fontSize: 14 },
  customLabel: { color: c.textSecondary, fontSize: 12, marginTop: 20, marginBottom: 8 }, customRow: { flexDirection: 'row', gap: 12, alignItems: 'center' }, customInput: { minHeight: 48, flex: 3, fontSize: 16, color: c.text, borderBottomWidth: 1, borderBottomColor: c.fieldBorder }, useCode: { minHeight: 48, justifyContent: 'center', paddingHorizontal: 16, borderRadius: 12, backgroundColor: c.accent }, useCodeText: { color: c.onAccent, fontSize: 13, fontFamily: 'Manrope_700Bold' },
});
