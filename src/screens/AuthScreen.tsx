import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { FirebaseError } from 'firebase/app';
import { useState } from 'react';
import {
  ActivityIndicator,
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

import { useAuth } from '../features/auth/AuthContext';

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
  const { signIn, signUp, resetPassword } = useAuth();
  const compact = useWindowDimensions().height < 720;
  const [mode, setMode] = useState<Mode>('login');
  const [name, setName] = useState('');
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
      if (mode === 'signup') await signUp(name, email, password);
      else await signIn(email, password);
    } catch (cause) {
      setMessage(authMessage(cause));
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
      colors={['#0B2115', '#050806', '#050806']}
      locations={[0, 0.36, 1]}
      style={styles.screen}
    >
      <StatusBar style="light" />
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
                <Ionicons name="chevron-back" size={22} color="#F6F7F6" />
              </Pressable>
            ) : null}

            <View style={[styles.form, compact && styles.formCompact]}>
              <Text style={[styles.title, compact && styles.titleCompact]}>
                {mode === 'login' ? 'Welcome\nback' : 'Create an\naccount'}
              </Text>

              <View style={[styles.fields, compact && styles.fieldsCompact]}>
                {mode === 'signup' ? (
                  <View style={styles.field}>
                    <Text style={styles.label}>Name</Text>
                    <TextInput
                      autoCapitalize="words"
                      autoComplete="name"
                      value={name}
                      onChangeText={setName}
                      placeholder="Your name"
                      placeholderTextColor="#626670"
                      style={styles.input}
                    />
                  </View>
                ) : null}

                <View style={styles.field}>
                  <Text style={styles.label}>Email</Text>
                  <TextInput
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoComplete="email"
                    keyboardType="email-address"
                    value={email}
                    onChangeText={setEmail}
                    placeholder="you@example.com"
                    placeholderTextColor="#626670"
                    style={styles.input}
                  />
                </View>

                <View style={styles.field}>
                  <Text style={styles.label}>Password</Text>
                  <View style={styles.passwordRow}>
                    <TextInput
                      autoCapitalize="none"
                      autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                      secureTextEntry={hidden}
                      value={password}
                      onChangeText={setPassword}
                      placeholder="At least 6 characters"
                      placeholderTextColor="#626670"
                      style={styles.passwordInput}
                    />
                    <Pressable
                      accessibilityLabel={hidden ? 'Show password' : 'Hide password'}
                      hitSlop={10}
                      onPress={() => setHidden((value) => !value)}
                    >
                      <Ionicons name={hidden ? 'eye-off-outline' : 'eye-outline'} size={21} color="#737780" />
                    </Pressable>
                  </View>
                </View>
              </View>

              {message ? <Text style={styles.message}>{message}</Text> : null}

              {mode === 'login' ? (
                <Pressable disabled={busy} onPress={() => void reset()} hitSlop={8}>
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
                  <ActivityIndicator color="#06110A" />
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

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#050806' },
  safe: { flex: 1 },
  flex: { flex: 1 },
  content: { flexGrow: 1, paddingHorizontal: 32, paddingTop: 8, paddingBottom: 32 },
  back: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: '#E4E6E5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  form: { flex: 1, paddingTop: 62 },
  formCompact: { paddingTop: 38 },
  title: {
    color: '#F7F8F7',
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 42,
    lineHeight: 44,
    letterSpacing: -1.7,
  },
  titleCompact: { fontSize: 36, lineHeight: 38 },
  fields: { gap: 28, marginTop: 58 },
  fieldsCompact: { gap: 20, marginTop: 34 },
  field: { gap: 7 },
  label: {
    color: '#F2F3F2',
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 13,
  },
  input: {
    minHeight: 42,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#777B84',
    color: '#F7F8F7',
    fontFamily: 'Manrope_500Medium',
    fontSize: 14,
    paddingHorizontal: 0,
    paddingVertical: 8,
  },
  passwordRow: {
    minHeight: 42,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#777B84',
    flexDirection: 'row',
    alignItems: 'center',
  },
  passwordInput: {
    flex: 1,
    color: '#F7F8F7',
    fontFamily: 'Manrope_500Medium',
    fontSize: 14,
    paddingHorizontal: 0,
    paddingVertical: 8,
  },
  message: { color: '#F08080', fontSize: 11, lineHeight: 16, marginTop: 16 },
  forgot: {
    color: '#2DBE70',
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 11,
    textAlign: 'right',
    marginTop: 14,
  },
  submit: {
    minHeight: 54,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2DBE70',
    marginTop: 32,
  },
  submitCompact: { marginTop: 22 },
  submitPressed: { backgroundColor: '#26A861', opacity: 0.96 },
  submitText: {
    color: '#06110A',
    fontFamily: 'Manrope_700Bold',
    fontSize: 14,
  },
  disabled: { opacity: 0.55 },
  switchRow: { flexDirection: 'row', justifyContent: 'center', gap: 5, marginTop: 20 },
  switchPrompt: { color: '#777B84', fontFamily: 'Manrope_500Medium', fontSize: 11 },
  switchAction: { color: '#2DBE70', fontFamily: 'Manrope_700Bold', fontSize: 11 },
});
