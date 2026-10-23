import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useMemo, useState, useCallback } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { AccountEditor } from '../components/AccountEditor';
import { AvatarPickerSheet } from '../components/AvatarPickerSheet';
import { FeedbackForm } from '../components/FeedbackForm';
import { AboutCubo } from '../components/AboutCubo';
import { ScreenShell } from '../components/ScreenShell';
import { ProfilePhotoButton } from '../components/ProfilePhotoButton';
import { ProfileAvatar } from '../components/ProfileAvatar';
import type { RootStackParamList } from '../navigation/types';
import { useAppearance } from '../theme/AppearanceContext';
import type { AppColors } from '../theme/colors';
import { spacing } from '../theme/theme';
import { useProfile } from '../features/profile/ProfileContext';
type Props = NativeStackScreenProps<RootStackParamList, 'SettingsDetail'>;
const content = {
  edit: ['Edit profile', 'Manage your profile, account details, and sign-in security.'],
  privacy: ['Privacy and safety', 'Camera frames and raw microphone audio are processed without being stored by CUBO. Your signed-in account syncs bounded vehicles, saved places, settings, completed trip scores, safety events, route coordinates, voice-assist text transcripts, Cubo Assistant text, and your selected avatar so they can return on another device. Your name and avatar are visible only inside approved Family and Friend connections. Local copies support offline use. Device permissions, camera calibration, hardware pairing, map/model caches, and uploaded profile photos remain on this device.'],
  help: ['Help and feedback', 'Something not working? Tell us what happened, or share an idea for CUBO.'],
  about: ['About CUBO', 'Student-built driver safety for the Congressional App Challenge.'],
} as const;
export function SettingsDetailScreen({ navigation, route }: Props) {
  const { colors } = useAppearance();
  const { profile, updateName, updateAvatar, updatePhoto } = useProfile();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const item = content[route.params.kind];
  const [name, setName] = useState(profile.name);
  const [message, setMessage] = useState('');
  const [avatarOpen, setAvatarOpen] = useState(false);
  const [avatarBusy, setAvatarBusy] = useState(false);
  useFocusEffect(useCallback(() => { setName(profile.name); setMessage(''); }, [profile.name]));
  const save = async () => { if (!name.trim()) return; try { await updateName(name); setMessage('Profile saved.'); } catch { setMessage('Could not save your name. Please try again.'); } };
  const selectAvatar = async (avatarId: typeof profile.avatarId) => { setAvatarBusy(true); setMessage(''); try { await updateAvatar(avatarId); updatePhoto(undefined); setAvatarOpen(false); setMessage('Avatar updated everywhere you are connected.'); } catch { setMessage('Could not update your avatar. Please try again.'); } finally { setAvatarBusy(false); } };
  return <ScreenShell><Pressable style={styles.back} onPress={() => navigation.goBack()}><Ionicons name="arrow-back" size={20} color={colors.text} /><Text style={styles.backText}>Account</Text></Pressable><Text style={styles.title}>{item[0]}</Text><Text style={styles.body}>{item[1]}</Text>{route.params.kind === 'edit' ? <><View style={styles.photoRow}><ProfileAvatar avatarId={profile.avatarId} photoUri={profile.photoUri} size={70} uid={profile.name} /><View style={styles.photoActions}><ProfilePhotoButton onPhoto={updatePhoto} /><Pressable accessibilityRole="button" accessibilityLabel="Edit avatar" onPress={() => setAvatarOpen(true)} style={styles.avatarButton}><Ionicons name="happy-outline" size={16} color={colors.accent} /><Text style={styles.avatarButtonText}>Edit avatar</Text></Pressable>{profile.photoUri ? <Pressable onPress={() => updatePhoto(undefined)}><Text style={styles.removePhoto}>Use avatar instead</Text></Pressable> : null}</View></View><Text style={styles.photoNote}>Your selected avatar syncs across approved connections. An uploaded photo stays only on this device.</Text><Text style={styles.label}>Driver name</Text><TextInput accessibilityLabel="Driver name" maxLength={80} style={styles.input} value={name} onChangeText={setName} placeholder="Driver name" placeholderTextColor={colors.textTertiary} /><Pressable style={[styles.save, !name.trim() && styles.disabled]} onPress={save}><Text style={styles.saveText}>Save profile</Text></Pressable>{message ? <Text accessibilityRole="alert" style={styles.body}>{message}</Text> : null}<AccountEditor /><AvatarPickerSheet visible={avatarOpen} value={profile.avatarId} busy={avatarBusy} onClose={() => setAvatarOpen(false)} onSelect={value => void selectAvatar(value)} /></> : route.params.kind === 'help' ? <FeedbackForm /> : route.params.kind === 'about' ? <AboutCubo /> : <View style={styles.note}><Ionicons name="checkmark-circle-outline" size={21} color={colors.accent} /><Text style={styles.noteText}>Family sharing requires consent. Camera footage is not included in shared driving summaries.</Text></View>}</ScreenShell>;
}
const makeStyles = (c: AppColors) => StyleSheet.create({ back: { alignSelf: 'flex-start', flexDirection: 'row', gap: 7, alignItems: 'center', padding: 10, borderRadius: 13, marginTop: spacing.md, backgroundColor: c.card }, backText: { color: c.text, fontWeight: '600' }, title: { color: c.text, fontSize: 28, fontFamily: 'Manrope_800ExtraBold', fontWeight: '800', marginTop: spacing.xl }, body: { color: c.textSecondary, fontSize: 14, lineHeight: 22 }, photoRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: spacing.lg }, photoActions: { flex: 1, gap: 8 }, avatarButton: { minHeight: 44, borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, backgroundColor: c.accentSoft, borderWidth: 1, borderColor: c.borderStrong }, avatarButtonText: { color: c.accent, fontFamily: 'Manrope_700Bold', fontSize: 12 }, removePhoto: { color: c.danger, textAlign: 'center', fontSize: 11, fontFamily: 'Manrope_700Bold' }, photoNote: { color: c.textTertiary, fontSize: 10, lineHeight: 15, marginTop: 8 }, label: { color: c.text, fontSize: 12, fontWeight: '700', marginTop: spacing.lg }, input: { color: c.text, backgroundColor: c.card, borderWidth: 1, borderColor: c.border, borderRadius: 14, minHeight: 50, paddingHorizontal: 13, fontSize: 15 }, save: { minHeight: 52, borderRadius: 16, backgroundColor: c.accent, alignItems: 'center', justifyContent: 'center', marginTop: spacing.md }, disabled: { opacity: .35 }, saveText: { color: c.onAccent, fontWeight: '800', fontSize: 14 }, note: { flexDirection: 'row', gap: 10, padding: spacing.lg, borderRadius: 18, backgroundColor: c.card, borderWidth: StyleSheet.hairlineWidth, borderColor: c.border, marginTop: spacing.lg }, noteText: { color: c.text, fontSize: 12, lineHeight: 18, flex: 1 } });
