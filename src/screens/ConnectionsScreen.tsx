import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { type NavigationProp, useNavigation } from '@react-navigation/native';
import { useMemo, useState } from 'react';
import { Share, StyleSheet, Switch, Text, TextInput, View } from 'react-native';

import { AppHeader } from '../components/AppHeader';
import { ConfirmSheet } from '../components/ConfirmSheet';
import { MotionPressable } from '../components/MotionPressable';
import { ScreenShell } from '../components/ScreenShell';
import { type ConnectionKind, type CuboConnection, useConnections } from '../features/connections/ConnectionContext';
import { useAuth } from '../features/auth/AuthContext';
import type { RootStackParamList } from '../navigation/types';
import { useAppearance } from '../theme/AppearanceContext';
import type { AppColors } from '../theme/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'Connections'>;
type Mode = 'enter' | 'create';

export function ConnectionsScreen({ navigation, route }: Props) {
  const { colors } = useAppearance();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const connection = useConnections();
  const { accountDetails } = useAuth();
  const [kind, setKind] = useState<ConnectionKind>(route.params?.kind ?? 'family');
  const [mode, setMode] = useState<Mode>(route.params?.action ?? 'enter');
  const [code, setCode] = useState('');
  const [created, setCreated] = useState<{ code: string; expiresAt: Date; kind: ConnectionKind } | null>(null);
  const [message, setMessage] = useState('');
  const items = connection.connections.filter(item => item.kind === kind);
  const incoming = connection.incoming.filter(item => item.kind === kind);
  const outgoing = connection.outgoing.filter(item => item.kind === kind);
  const minorFamily = kind === 'family' && accountDetails?.accountType === 'minor';

  const run = async (work: () => Promise<void>, success?: string) => {
    setMessage('');
    try { await work(); if (success) setMessage(success); }
    catch (cause) { setMessage(cause instanceof Error ? cause.message : 'Could not complete that request.'); }
  };
  const create = () => run(async () => { const next = await connection.createCode(kind); setCreated(next); }, undefined);
  const enter = () => run(async () => { const request = await connection.enterCode(code, kind); setCode(''); setMessage(`Request sent to ${request.ownerName}. They must approve it before anything is shared.`); });
  const shareCode = async () => {
    if (!created) return;
    const label = created.kind === 'family' ? 'Family' : 'Friend';
    await Share.share({ message: `Join me on CUBO as ${label === 'Family' ? 'family' : 'a friend'}. Open CUBO, tap Enter Code, and use ${created.code}. This code expires in 15 minutes.` });
  };

  return <ScreenShell>
    <AppHeader title="Family / Friends" onBack={() => navigation.goBack()} />
    <Text style={styles.intro}>Family connections support safety oversight. Friend connections only share the safety score or current location each person chooses.</Text>
    <View style={styles.segment} accessibilityRole="tablist">
      {(['family', 'friend'] as const).map(value => <MotionPressable key={value} accessibilityRole="tab" accessibilityState={{ selected: kind === value }} style={[styles.segmentButton, kind === value && styles.segmentSelected]} onPress={() => { setKind(value); setCreated(null); setMessage(''); }}><Ionicons name={value === 'family' ? 'people-outline' : 'happy-outline'} size={18} color={kind === value ? colors.onAccent : colors.textSecondary} /><Text style={[styles.segmentText, kind === value && styles.segmentTextSelected]}>{value === 'family' ? 'Family' : 'Friends'}</Text></MotionPressable>)}
    </View>

    <View style={styles.heroCard}>
      <View style={styles.heroIcon}><Ionicons name={kind === 'family' ? 'shield-checkmark-outline' : 'sparkles-outline'} size={24} color={colors.accent} /></View>
      <View style={styles.fill}><Text style={styles.heroTitle}>{kind === 'family' ? 'Join Your Family' : 'Connect With Friends'}</Text><Text style={styles.helper}>{kind === 'family' ? 'Enter an organizer’s code. An adult organizer approves every request.' : 'Either person can create a code. Sharing stays off until each person enables it.'}</Text></View>
    </View>

    <View style={styles.modeRow}>
      <MotionPressable style={[styles.modeButton, mode === 'enter' && styles.modeSelected]} onPress={() => { setMode('enter'); setCreated(null); }}><Text style={[styles.modeText, mode === 'enter' && styles.modeTextSelected]}>Enter Code</Text></MotionPressable>
      <MotionPressable style={[styles.modeButton, mode === 'create' && styles.modeSelected]} onPress={() => { setMode('create'); setCreated(null); }}><Text style={[styles.modeText, mode === 'create' && styles.modeTextSelected]}>Create Code</Text></MotionPressable>
    </View>

    {mode === 'enter' ? <View style={styles.flowCard}><Text style={styles.cardTitle}>Enter a {kind === 'family' ? 'Family' : 'Friend'} code</Text><Text style={styles.helper}>Codes only work in their matching section. One person can appear once in Family and once in Friends.</Text><TextInput autoCapitalize="characters" autoCorrect={false} value={code} onChangeText={setCode} placeholder={kind === 'family' ? 'F-ABCD-2345' : 'R-ABCD-2345'} placeholderTextColor={colors.textTertiary} style={styles.codeInput} maxLength={12} /><MotionPressable disabled={connection.loading || !code.trim()} style={[styles.primary, (!code.trim() || connection.loading) && styles.disabled]} onPress={() => void enter()}><Text style={styles.primaryText}>{connection.loading ? 'Checking…' : 'Send Join Request'}</Text><Ionicons name="arrow-forward" size={18} color={colors.onAccent} /></MotionPressable></View>
      : <View style={styles.flowCard}><Text style={styles.cardTitle}>Create a {kind === 'family' ? 'Family' : 'Friend'} code</Text><Text style={styles.helper}>{minorFamily ? 'Minor accounts are not eligible to generate Family codes. You can still tap below for guidance or enter a code from an adult organizer.' : kind === 'family' ? 'Share this with a parent, guardian, or minor you want in your family.' : 'Share this with a friend. Either of you can leave at any time.'}</Text>{created?.kind === kind ? <View style={styles.createdBox}><Text style={styles.codeLabel}>YOUR CODE</Text><Text selectable style={styles.createdCode}>{created.code}</Text><Text style={styles.expiry}>Expires in 15 minutes</Text><View style={styles.actionRow}><MotionPressable style={styles.secondary} onPress={() => void Clipboard.setStringAsync(created.code)}><Ionicons name="copy-outline" size={18} color={colors.accent} /><Text style={styles.secondaryText}>Copy</Text></MotionPressable><MotionPressable style={styles.primarySmall} onPress={() => void shareCode()}><Ionicons name="share-outline" size={18} color={colors.onAccent} /><Text style={styles.primaryText}>Share</Text></MotionPressable></View></View> : <MotionPressable disabled={connection.loading} style={[styles.primary, connection.loading && styles.disabled]} onPress={() => void create()}><Text style={styles.primaryText}>{connection.loading ? 'Creating…' : minorFamily ? 'Why can’t I generate one?' : 'Generate Secure Code'}</Text><Ionicons name={minorFamily ? 'information-circle-outline' : 'key-outline'} size={18} color={colors.onAccent} /></MotionPressable>}</View>}

    {message || connection.error ? <View accessibilityRole="alert" style={styles.notice}><Ionicons name={(message || connection.error).includes('sent') ? 'checkmark-circle' : 'information-circle'} size={18} color={colors.accent} /><Text style={styles.noticeText}>{message || connection.error}</Text></View> : null}

    {incoming.length ? <><Text style={styles.sectionTitle}>Requests To Review</Text>{incoming.map(item => <View key={item.id} style={styles.requestCard}><View style={styles.personIcon}><Text style={styles.initial}>{item.requesterName.slice(0, 1).toUpperCase()}</Text></View><View style={styles.fill}><Text style={styles.personName}>{item.requesterName}</Text><Text style={styles.helper}>{item.kind === 'family' ? item.requesterAccountType === 'minor' ? 'Minor requesting family access' : 'Adult requesting family access' : 'Friend request'}</Text></View><MotionPressable style={styles.iconButton} accessibilityLabel={`Decline ${item.requesterName}`} onPress={() => void run(() => connection.declineRequest(item), 'Request declined.')}><Ionicons name="close" size={20} color={colors.danger} /></MotionPressable><MotionPressable style={[styles.iconButton, styles.approve]} accessibilityLabel={`Approve ${item.requesterName}`} onPress={() => void run(() => connection.approveRequest(item), `${item.requesterName} is now connected.`)}><Ionicons name="checkmark" size={20} color={colors.onAccent} /></MotionPressable></View>)}</> : null}
    {outgoing.length ? <><Text style={styles.sectionTitle}>Waiting For Approval</Text>{outgoing.map(item => <View key={item.id} style={styles.requestCard}><View style={styles.personIcon}><Ionicons name="time-outline" size={20} color={colors.accent} /></View><View style={styles.fill}><Text style={styles.personName}>{item.ownerName}</Text><Text style={styles.helper}>Request sent · Nothing shared yet</Text></View></View>)}</> : null}

    <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>{kind === 'family' ? 'Your Family' : 'Your Friends'}</Text><Text style={styles.count}>{items.length}</Text></View>
    {!items.length ? <View style={styles.empty}><Ionicons name={kind === 'family' ? 'people-outline' : 'chatbubbles-outline'} size={28} color={colors.accent} /><Text style={styles.emptyTitle}>No {kind === 'family' ? 'family members' : 'friends'} connected yet</Text><Text style={styles.helper}>{kind === 'family' ? 'Create or enter a code to link accounts safely.' : 'A Friend code gives you a private connection with optional sharing.'}</Text></View> : items.map(item => <ConnectionCard key={item.id} item={item} />)}
  </ScreenShell>;
}

function ConnectionCard({ item }: { item: CuboConnection }) {
  const { colors } = useAppearance(); const styles = useMemo(() => makeStyles(colors), [colors]);
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const { user } = useAuth(); const connection = useConnections(); const [busy, setBusy] = useState(''); const [message, setMessage] = useState(''); const [confirmRemove, setConfirmRemove] = useState(false);
  const owner = item.ownerUid === user?.uid; const name = owner ? item.memberName : item.ownerName;
  const myScore = owner ? item.ownerShareScore : item.memberShareScore; const myLocation = owner ? item.ownerShareLocation : item.memberShareLocation;
  const theirScoreEnabled = owner ? item.memberShareScore : item.ownerShareScore; const theirScore = owner ? item.memberScore : item.ownerScore;
  const theirScoreMeasured = owner ? item.memberScoreMeasured === true : item.ownerScoreMeasured === true;
  const theirLocation = owner ? item.memberShareLocation : item.ownerShareLocation; const theirLocationAt = owner ? item.memberLocationAt : item.ownerLocationAt;
  const toggle = async (key: 'score' | 'location', enabled: boolean) => { setBusy(key); setMessage(''); try { await connection.setSharing(item, key, enabled); } catch (cause) { setMessage(cause instanceof Error ? cause.message : 'Sharing could not be updated.'); } finally { setBusy(''); } };
  const remove = async () => { setConfirmRemove(false); setBusy('remove'); setMessage(''); try { await connection.removeConnection(item); } catch (cause) { setMessage(cause instanceof Error ? cause.message : 'Connection could not be removed.'); } finally { setBusy(''); } };
  const familyRole = owner ? item.memberAccountType === 'minor' ? 'Family · Minor' : 'Family · Parent/Guardian' : 'Family · Parent/Guardian';
  return <View style={styles.connectionCard}><View style={styles.connectionTop}><View style={styles.personIcon}><Text style={styles.initial}>{name.slice(0, 1).toUpperCase()}</Text></View><View style={styles.fill}><Text style={styles.personName}>{name}</Text><Text style={styles.helper}>{item.kind === 'family' ? familyRole : 'Friend · Private connection'}</Text></View><MotionPressable accessibilityLabel={`View ${name}'s profile`} style={styles.profileButton} onPress={() => navigation.navigate('ConnectionProfile', { connectionId: item.id })}><Ionicons name="arrow-forward" size={18} color={colors.accent} /></MotionPressable></View>{item.kind === 'friend' ? <><View style={styles.sharedPreview}><View><Text style={styles.previewValue}>{theirScoreEnabled ? theirScore ?? 100 : 'Hidden'}</Text><Text style={styles.previewLabel}>{!theirScoreEnabled ? 'SCORE PRIVATE' : theirScoreMeasured ? 'SAFETY SCORE' : 'STARTER SCORE'}</Text></View><View style={styles.previewDivider} /><View style={styles.fill}><Text style={styles.previewStatus}>{theirLocation ? 'Location Shared' : 'Location Hidden'}</Text><Text style={styles.helper}>{theirLocationAt ? `Updated ${theirLocationAt.toDate().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}` : 'They control what you can see.'}</Text></View></View><ShareRow icon="speedometer-outline" label="Share My Safety Score" value={myScore} disabled={busy !== ''} onChange={value => void toggle('score', value)} /><ShareRow icon="location-outline" label="Share My Current Location" value={myLocation} disabled={busy !== ''} onChange={value => void toggle('location', value)} /></> : <Text style={[styles.helper, { marginTop: 12 }]}>Open the profile for family safety details and parent controls.</Text>}{message ? <Text accessibilityRole="alert" style={[styles.helper, { color: colors.danger, marginTop: 8 }]}>{message}</Text> : null}<MotionPressable disabled={busy !== ''} style={styles.removeButton} onPress={() => setConfirmRemove(true)}><Text style={styles.removeText}>Remove Connection</Text></MotionPressable><ConfirmSheet visible={confirmRemove} title={`Remove ${name}?`} body={`This removes the ${item.kind} connection for both accounts. Shared score and location access will stop.`} confirmLabel="Remove connection" onCancel={() => setConfirmRemove(false)} onConfirm={() => void remove()} /></View>;
}
function ShareRow({ icon, label, value, disabled, onChange }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: boolean; disabled: boolean; onChange: (value: boolean) => void }) {
  const { colors } = useAppearance(); const styles = useMemo(() => makeStyles(colors), [colors]);
  return <View style={styles.shareRow}><Ionicons name={icon} size={19} color={colors.textSecondary} /><Text style={[styles.personName, styles.fill, { fontSize: 13 }]}>{label}</Text><Switch value={value} disabled={disabled} onValueChange={onChange} trackColor={{ false: colors.surfaceMuted, true: colors.accent }} thumbColor="#FFFFFF" /></View>;
}

const makeStyles = (c: AppColors) => StyleSheet.create({
  fill: { flex: 1 }, intro: { color: c.textSecondary, fontSize: 12, lineHeight: 18, marginBottom: 8 }, segment: { flexDirection: 'row', backgroundColor: c.surfaceMuted, borderRadius: 18, padding: 4, gap: 4 }, segmentButton: { flex: 1, minHeight: 48, borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }, segmentSelected: { backgroundColor: c.accent }, segmentText: { color: c.textSecondary, fontFamily: 'Manrope_700Bold', fontSize: 13 }, segmentTextSelected: { color: c.onAccent },
  heroCard: { marginTop: 12, flexDirection: 'row', gap: 13, alignItems: 'center', borderRadius: 22, padding: 18, backgroundColor: c.card, borderWidth: 1, borderColor: c.borderStrong }, heroIcon: { width: 48, height: 48, borderRadius: 16, backgroundColor: c.accentSoft, alignItems: 'center', justifyContent: 'center' }, heroTitle: { color: c.text, fontFamily: 'Manrope_800ExtraBold', fontSize: 17 }, helper: { color: c.textSecondary, fontSize: 11, lineHeight: 16, marginTop: 3 },
  modeRow: { flexDirection: 'row', marginTop: 16, gap: 8 }, modeButton: { flex: 1, minHeight: 44, borderRadius: 14, borderWidth: 1, borderColor: c.border, alignItems: 'center', justifyContent: 'center', backgroundColor: c.card }, modeSelected: { borderColor: c.accent, backgroundColor: c.accentSoft }, modeText: { color: c.textSecondary, fontFamily: 'Manrope_700Bold', fontSize: 12 }, modeTextSelected: { color: c.accent },
  flowCard: { backgroundColor: c.card, borderRadius: 22, borderWidth: 1, borderColor: c.borderStrong, padding: 18, gap: 13 }, cardTitle: { color: c.text, fontFamily: 'Manrope_800ExtraBold', fontSize: 16 }, codeInput: { minHeight: 58, borderRadius: 16, borderWidth: 1, borderColor: c.borderStrong, backgroundColor: c.background, color: c.text, paddingHorizontal: 16, textAlign: 'center', fontFamily: 'Manrope_800ExtraBold', fontSize: 19, letterSpacing: 2 }, primary: { minHeight: 54, borderRadius: 16, backgroundColor: c.accent, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, paddingHorizontal: 16 }, primarySmall: { flex: 1, minHeight: 48, borderRadius: 14, backgroundColor: c.accent, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }, primaryText: { color: c.onAccent, fontFamily: 'Manrope_800ExtraBold', fontSize: 13 }, disabled: { opacity: .45 },
  createdBox: { borderRadius: 18, backgroundColor: c.accentSoft, padding: 18, alignItems: 'center', borderWidth: 1, borderColor: c.borderStrong }, codeLabel: { color: c.accent, fontFamily: 'Manrope_800ExtraBold', fontSize: 9, letterSpacing: 1.4 }, createdCode: { color: c.text, fontFamily: 'Manrope_800ExtraBold', fontSize: 25, letterSpacing: 2, marginTop: 6 }, expiry: { color: c.textSecondary, fontSize: 10, marginTop: 4 }, actionRow: { flexDirection: 'row', gap: 9, marginTop: 16, width: '100%' }, secondary: { flex: 1, minHeight: 48, borderRadius: 14, backgroundColor: c.card, borderWidth: 1, borderColor: c.borderStrong, flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center' }, secondaryText: { color: c.accent, fontFamily: 'Manrope_800ExtraBold', fontSize: 13 },
  notice: { flexDirection: 'row', gap: 9, borderRadius: 15, padding: 13, backgroundColor: c.accentSoft, borderWidth: 1, borderColor: c.border, alignItems: 'center' }, noticeText: { flex: 1, color: c.text, fontSize: 11, lineHeight: 16 }, sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, sectionTitle: { color: c.text, fontFamily: 'Manrope_800ExtraBold', fontSize: 17, marginTop: 10 }, count: { color: c.accent, fontFamily: 'Manrope_800ExtraBold', fontSize: 12 },
  requestCard: { flexDirection: 'row', gap: 10, alignItems: 'center', borderRadius: 18, padding: 14, backgroundColor: c.card, borderWidth: 1, borderColor: c.border }, personIcon: { width: 42, height: 42, borderRadius: 14, backgroundColor: c.accentSoft, alignItems: 'center', justifyContent: 'center' }, initial: { color: c.accent, fontFamily: 'Manrope_800ExtraBold', fontSize: 14 }, personName: { color: c.text, fontFamily: 'Manrope_700Bold', fontSize: 14 }, iconButton: { width: 42, height: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: c.dangerSoft }, approve: { backgroundColor: c.accent }, profileButton: { width: 42, height: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: c.accentSoft },
  empty: { minHeight: 150, borderRadius: 22, borderWidth: 1, borderStyle: 'dashed', borderColor: c.borderStrong, alignItems: 'center', justifyContent: 'center', padding: 24 }, emptyTitle: { color: c.text, fontFamily: 'Manrope_700Bold', fontSize: 14, marginTop: 8 }, connectionCard: { borderRadius: 22, padding: 17, backgroundColor: c.card, borderWidth: 1, borderColor: c.borderStrong }, connectionTop: { flexDirection: 'row', gap: 11, alignItems: 'center' }, sharedPreview: { flexDirection: 'row', alignItems: 'center', backgroundColor: c.accentSoft, borderRadius: 16, padding: 14, marginTop: 14, gap: 14 }, previewValue: { color: c.text, fontFamily: 'Manrope_800ExtraBold', fontSize: 22 }, previewLabel: { color: c.accent, fontFamily: 'Manrope_800ExtraBold', fontSize: 7, letterSpacing: .8 }, previewDivider: { width: StyleSheet.hairlineWidth, height: 38, backgroundColor: c.borderStrong }, previewStatus: { color: c.text, fontFamily: 'Manrope_700Bold', fontSize: 12 }, shareRow: { minHeight: 56, flexDirection: 'row', gap: 11, alignItems: 'center', borderBottomWidth: StyleSheet.hairlineWidth, borderColor: c.border }, removeButton: { minHeight: 44, justifyContent: 'center', alignItems: 'center', marginTop: 6 }, removeText: { color: c.danger, fontFamily: 'Manrope_700Bold', fontSize: 12 },
});
