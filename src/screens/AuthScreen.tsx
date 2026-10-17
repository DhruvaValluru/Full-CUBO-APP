import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { FirebaseError } from 'firebase/app';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { makeAccountDetails, parseBirthDate } from '../features/auth/accountDetails';
import { formatBirthInput, formatPhoneInput, internationalPhone, phoneCountries, phoneDigits } from '../features/auth/inputFormatting';
import { useAuth } from '../features/auth/AuthContext';
import { useAppearance } from '../theme/AppearanceContext';
import { authTheme } from '../theme/authTheme';

type Mode = 'login' | 'signup';
type Props = { onBack?: () => void };

function authMessage(cause: unknown) {
  if (!(cause instanceof FirebaseError)) return 'Something went wrong. Please try again.';
  const messages: Record<string, string> = {
    'auth/email-already-in-use': 'An account already uses this email.',
    'auth/invalid-credential': 'That email or password is incorrect.',
    'auth/invalid-email': 'Enter a valid email address.',
    'auth/too-many-requests': 'Too many attempts. Wait a moment and try again.',
    'auth/weak-password': 'Use a password with at least 6 characters.',
    'auth/network-request-failed': 'Check your internet connection and try again.',
  };
  return messages[cause.code] ?? 'Could not complete that request. Please try again.';
}

export function AuthScreen({ onBack }: Props) {
  const { colors, mode: appearance } = useAppearance();
  const palette = useMemo(() => authTheme(colors, appearance), [colors, appearance]);
  const styles = useMemo(() => makeStyles(palette), [palette]);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const focusProps = (field: string) => ({ onFocus: () => setFocusedField(field), onBlur: () => setFocusedField(null), selectionColor: palette.accent, keyboardAppearance: appearance });
  const { signIn, signUp, resetPassword } = useAuth();
  const compact = useWindowDimensions().height < 720;
  const [mode, setMode] = useState<Mode>('login');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [country, setCountry] = useState<{ name: string; region: string; code: string }>(phoneCountries[0]);
  const [countryPicker, setCountryPicker] = useState(false);
  const [customCode, setCustomCode] = useState('');
  const [birthError, setBirthError] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [hidden, setHidden] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  const submit = async () => {
    if (!email.trim() || password.length < 6 || (mode === 'signup' && !name.trim())) {
      setMessage('Complete every field and use at least 6 password characters.');
      return;
    }
    setBusy(true);
    setMessage('');
    try {
      if (mode === 'signup') await signUp(name, email, password, makeAccountDetails(birthDate, internationalPhone(phone, country.code)));
      else await signIn(email, password);
    } catch (cause) {
      setMessage(cause instanceof Error && !(cause instanceof FirebaseError) ? cause.message : authMessage(cause));
    } finally {
      setBusy(false);
    }
  };

  const reset = async () => {
    if (!email.trim()) {
      setMessage('Enter your email first, then tap Forgot password.');
      return;
    }
    setBusy(true);
    setMessage('');
    try {
      await resetPassword(email);
      setMessage('Password reset email sent.');
    } catch (cause) {
      setMessage(authMessage(cause));
    } finally {
      setBusy(false);
    }
  };

  const changeMode = (next: Mode) => {
    setMode(next);
    setMessage('');
    setPassword('');
  };

  return (
    <LinearGradient
      colors={palette.gradient}
      locations={[0, 0.36, 1]}
      style={styles.screen}
    >
      <StatusBar style={appearance === 'dark' ? 'light' : 'dark'} />
      <Modal visible={countryPicker} transparent animationType="fade" onRequestClose={() => setCountryPicker(false)}>
        <View style={styles.pickerBackdrop}><Pressable accessibilityLabel="Close country selector" style={StyleSheet.absoluteFill} onPress={() => setCountryPicker(false)} /><SafeAreaView style={styles.pickerSheet}>
          <View style={styles.pickerHeader}><Text style={styles.pickerTitle}>Country calling code</Text><Pressable accessibilityRole="button" accessibilityLabel="Close country selector" style={styles.pickerClose} onPress={() => setCountryPicker(false)}><Ionicons name="close" size={22} color={palette.text} /></Pressable></View>
          <ScrollView keyboardShouldPersistTaps="handled">{phoneCountries.map(item => <Pressable accessibilityRole="button" key={item.region} style={styles.countryOption} onPress={() => { setCountry(item); setPhone(value => phoneDigits(value, item.code)); setCountryPicker(false); }}><Text style={styles.optionText}>{item.name}</Text><Text style={styles.optionCode}>+{item.code}</Text>{country.region === item.region ? <Ionicons name="checkmark" size={20} color={palette.accent} /> : null}</Pressable>)}
            <Text style={styles.customLabel}>Other country calling code</Text>
            <View style={styles.customRow}>
              <Text style={styles.optionText}>+</Text>
              <TextInput {...focusProps('customCode')} accessibilityLabel="Other country calling code" keyboardType="number-pad" maxLength={3} value={customCode} onChangeText={value => setCustomCode(value.replace(/\D/g, ''))} placeholder="Code" placeholderTextColor={palette.textSecondary} style={[styles.customInput, focusedField === 'customCode' && { borderBottomColor: palette.accent, borderBottomWidth: 2 }]} />
              <Pressable accessibilityRole="button" disabled={!/^[1-9]\d{0,2}$/.test(customCode)} style={[styles.useCode, !/^[1-9]\d{0,2}$/.test(customCode) && styles.disabled]} onPress={() => { setCountry({ name: 'Other country', region: '', code: customCode }); setPhone(value => phoneDigits(value, customCode)); setCountryPicker(false); }}><Text style={styles.useCodeText}>Use code</Text></Pressable>
            </View>
          </ScrollView>
        </SafeAreaView></View>
      </Modal>
      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.content}
          >
            {onBack ? (
              <Pressable
                accessibilityLabel="Back to welcome"
                accessibilityRole="button"
                hitSlop={8}
                onPress={onBack}
                style={styles.back}
              >
                <Ionicons name="chevron-back" size={22} color={palette.text} />
              </Pressable>
            ) : null}

            <View style={[styles.form, (compact || mode === 'signup') && styles.formCompact]}>
              <Text style={[styles.title, compact && styles.titleCompact]}>
                {mode === 'login' ? 'Welcome\nback' : 'Create an\naccount'}
              </Text>

              <View style={[styles.fields, (compact || mode === 'signup') && styles.fieldsCompact]}>
                {mode === 'signup' ? (
                  <View style={styles.field}>
                    <Text style={styles.label}>Name</Text>
                    <TextInput
                      {...focusProps('name')}
                      accessibilityLabel="Name"
                      autoCapitalize="words"
                      autoComplete="name"
                      value={name}
                      onChangeText={setName}
                      placeholder="Your name"
                      placeholderTextColor={palette.textSecondary}
                      style={[styles.input, focusedField === 'name' && styles.inputFocused]}
                    />
                  </View>
                ) : null}

                <View style={styles.field}>
                  <Text style={styles.label}>Email</Text>
                  <TextInput
                    {...focusProps('email')}
                    accessibilityLabel="Email"
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoComplete="email"
                    keyboardType="email-address"
                    value={email}
                    onChangeText={setEmail}
                    placeholder="you@example.com"
                    placeholderTextColor={palette.textSecondary}
                    style={[styles.input, focusedField === 'email' && styles.inputFocused]}
                  />
                </View>

                {mode === 'signup' ? <>
                  <View style={styles.field}><Text style={styles.label}>Phone number</Text><View style={styles.phoneRow}>
                    <Pressable accessibilityRole="button" accessibilityLabel={`Country calling code: ${country.name}, +${country.code}`} onPress={() => setCountryPicker(true)} style={styles.countryButton}><Text style={styles.countryText}>{country.region} +{country.code}</Text><Ionicons name="chevron-down" size={14} color={palette.textSecondary} /></Pressable>
                    <TextInput {...focusProps('phone')} accessibilityLabel="Phone number" autoComplete="tel-national" keyboardType="phone-pad" value={formatPhoneInput(phone, country.code)} onChangeText={value => setPhone(phoneDigits(value, country.code))} placeholder={country.code === '1' ? '(919) 555-0123' : 'Phone number'} placeholderTextColor={palette.textSecondary} style={[styles.input, styles.phoneInput, focusedField === 'phone' && styles.inputFocused]} />
                  </View></View>
                  <View style={styles.field}><Text style={styles.label}>Date of birth</Text><TextInput {...focusProps('birth')} accessibilityLabel="Date of birth, month day year" keyboardType="number-pad" value={birthDate} onChangeText={value => { setBirthDate(previous => formatBirthInput(value, previous)); setBirthError(''); }} onBlur={() => { setFocusedField(null); if (!birthDate) return; try { parseBirthDate(birthDate); setBirthError(''); } catch (error) { setBirthError(error instanceof Error ? error.message : 'Enter a valid birth date.'); } }} placeholder="MM/DD/YYYY" maxLength={10} placeholderTextColor={palette.textSecondary} style={[styles.input, focusedField === 'birth' && styles.inputFocused]} />{birthError ? <Text accessibilityRole="alert" style={styles.fieldError}>{birthError}</Text> : null}<Text style={{ color: palette.textSecondary, fontSize: 11, lineHeight: 17 }}>Type month, day, then year—we add the slashes. Under 18 accounts are marked as minor accounts. Age is self-declared; phone verification and guardian linking are coming later.</Text></View>
                </> : null}
                <View style={styles.field}>
                  <Text style={styles.label}>Password</Text>
                  <View style={[styles.passwordRow, focusedField === 'password' && styles.inputFocused]}>
                    <TextInput
                      {...focusProps('password')}
                      accessibilityLabel="Password"
                      autoCapitalize="none"
                      autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                      secureTextEntry={hidden}
                      value={password}
                      onChangeText={setPassword}
                      placeholder="At least 6 characters"
                      placeholderTextColor={palette.textSecondary}
                      style={styles.passwordInput}
                    />
                    <Pressable
                      accessibilityRole="button"
                      style={styles.eyeButton}
                      accessibilityLabel={hidden ? 'Show password' : 'Hide password'}
                      hitSlop={10}
                      onPress={() => setHidden((value) => !value)}
                    >
                      <Ionicons name={hidden ? 'eye-off-outline' : 'eye-outline'} size={21} color={palette.textSecondary} />
                    </Pressable>
                  </View>
                </View>
              </View>

              {message ? <Text accessibilityLiveRegion="polite" style={[styles.message, message === 'Password reset email sent.' && { color: palette.accent }]}>{message}</Text> : null}

              {mode === 'login' ? (
                <Pressable accessibilityRole="button" disabled={busy} onPress={() => void reset()} hitSlop={8}>
                  <Text style={styles.forgot}>Forgot password?</Text>
                </Pressable>
              ) : null}

              <Pressable
                accessibilityRole="button"
                disabled={busy}
                onPress={() => void submit()}
                style={({ pressed }) => [
                  styles.submit,
                  compact && styles.submitCompact,
                  pressed && styles.submitPressed,
                  busy && styles.disabled,
                ]}
              >
                {busy ? (
                  <ActivityIndicator color={palette.onAccent} />
                ) : (
                  <Text style={styles.submitText}>
                    {mode === 'login' ? 'Log in' : 'Create account'}
                  </Text>
                )}
              </Pressable>

              <View style={styles.switchRow}>
                <Text style={styles.switchPrompt}>
                  {mode === 'login' ? 'New to CUBO?' : 'Already have an account?'}
                </Text>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => changeMode(mode === 'login' ? 'signup' : 'login')}
                  hitSlop={8}
                >
                  <Text style={styles.switchAction}>
                    {mode === 'login' ? 'Create account' : 'Sign in'}
                  </Text>
                </Pressable>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const makeStyles = (c: ReturnType<typeof authTheme>) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: c.background },
  safe: { flex: 1 },
  flex: { flex: 1 },
  content: { flexGrow: 1, width: '100%', maxWidth: 480, alignSelf: 'center', paddingHorizontal: 28, paddingTop: 8, paddingBottom: 32 },
  back: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: c.borderStrong,
    backgroundColor: c.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  form: { flex: 1, paddingTop: 56 },
  formCompact: { paddingTop: 32 },
  title: {
    color: c.text,
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 42,
    lineHeight: 44,
    letterSpacing: -1.4,
  },
  titleCompact: { fontSize: 36, lineHeight: 38 },
  fields: { gap: 24, marginTop: 40 },
  fieldsCompact: { gap: 20, marginTop: 28 },
  field: { gap: 7 },
  phoneRow: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  countryButton: { minHeight: 52, flexDirection: 'row', gap: 8, alignItems: 'center', paddingHorizontal: 12, borderRadius: 12, borderWidth: 1, borderColor: c.fieldBorder, backgroundColor: c.card },
  countryText: { color: c.text, fontSize: 13, fontFamily: 'Manrope_600SemiBold' },
  phoneInput: { flex: 1, minWidth: 0 },
  fieldError: { color: c.errorText, fontSize: 12 },
  pickerBackdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,.4)' },
  pickerSheet: { backgroundColor: c.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 24, paddingBottom: 24, maxHeight: '75%' },
  pickerHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 12, paddingBottom: 8 },
  pickerTitle: { color: c.text, fontSize: 18, fontFamily: 'Manrope_700Bold' },
  pickerClose: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  countryOption: { flexDirection: 'row', gap: 12, minHeight: 48, alignItems: 'center', borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: c.border },
  optionText: { flex: 1, color: c.text, fontSize: 15 },
  optionCode: { color: c.textSecondary, fontSize: 14 },
  customLabel: { color: c.textSecondary, fontSize: 12, marginTop: 20, marginBottom: 8 },
  customRow: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  customInput: { minHeight: 48, flex: 3, fontSize: 16, color: c.text, borderBottomWidth: 1, borderBottomColor: c.fieldBorder },
  useCode: { minHeight: 48, justifyContent: 'center', paddingHorizontal: 16, borderRadius: 12, backgroundColor: c.accent },
  useCodeText: { color: c.onAccent, fontSize: 13, fontFamily: 'Manrope_700Bold' },
  label: {
    color: c.text,
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 13,
  },
  input: {
    minHeight: 52,
    borderWidth: 1,
    borderRadius: 12,
    borderColor: c.fieldBorder,
    backgroundColor: c.card,
    color: c.text,
    fontFamily: 'Manrope_500Medium',
    fontSize: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  passwordRow: {
    minHeight: 52,
    borderWidth: 1,
    borderRadius: 12,
    borderColor: c.fieldBorder,
    backgroundColor: c.card,
    paddingLeft: 14,
    paddingRight: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  passwordInput: {
    flex: 1,
    color: c.text,
    fontFamily: 'Manrope_500Medium',
    fontSize: 16,
    minWidth: 0,
    paddingHorizontal: 0,
    paddingVertical: 8,
  },
  inputFocused: { borderColor: c.accent, borderWidth: 2 },
  eyeButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  message: { color: c.errorText, fontSize: 13, lineHeight: 20, marginTop: 16 },
  forgot: {
    color: c.accent,
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 13,
    textAlign: 'right',
    paddingTop: 16,
    minHeight: 44,
  },
  submit: {
    minHeight: 54,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: c.accent,
    marginTop: 24,
  },
  submitCompact: { marginTop: 22 },
  submitPressed: { opacity: 0.84 },
  submitText: {
    color: c.onAccent,
    fontFamily: 'Manrope_700Bold',
    fontSize: 14,
  },
  disabled: { opacity: 0.55 },
  switchRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 16 },
  switchPrompt: { color: c.textSecondary, fontFamily: 'Manrope_500Medium', fontSize: 13 },
  switchAction: { color: c.accent, fontFamily: 'Manrope_700Bold', fontSize: 13, minHeight: 44, paddingVertical: 12 },
});
