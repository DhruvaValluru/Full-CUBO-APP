import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useMemo, useState } from 'react';
import { StyleSheet, Switch, Text, View } from 'react-native';

import { AppHeader } from '../components/AppHeader';
import { ConfirmSheet } from '../components/ConfirmSheet';
import { DrivingAppLimitsCard } from '../components/DrivingAppLimitsCard';
import { MotionPressable } from '../components/MotionPressable';
import { ScreenShell } from '../components/ScreenShell';
import { SharedLocationMap } from '../components/SharedLocationMap';
import { useAuth } from '../features/auth/AuthContext';
import { useConnections } from '../features/connections/ConnectionContext';
import type { RootStackParamList } from '../navigation/types';
import { useAppearance } from '../theme/AppearanceContext';
import type { AppColors } from '../theme/colors';

export function ConnectionProfileScreen({ navigation, route }: NativeStackScreenProps<RootStackParamList, 'ConnectionProfile'>) {
  const { colors } = useAppearance(); const styles = useMemo(() => makeStyles(colors), [colors]);
  const { user } = useAuth(); const connection = useConnections();
  const [busy, setBusy] = useState(''); const [message, setMessage] = useState(''); const [confirmRemove, setConfirmRemove] = useState(false);
  const item = connection.connections.find(value => value.id === route.params.connectionId);
  if (!item || !user) return <ScreenShell><AppHeader title="Connection" onBack={() => navigation.goBack()} /><View style={styles.empty}><Ionicons name="person-remove-outline" size={28} color={colors.accent} /><Text style={styles.title}>This connection is no longer available.</Text></View></ScreenShell>;
  const owner = item.ownerUid === user.uid;
  const name = owner ? item.memberName : item.ownerName;
  const theirScoreEnabled = owner ? item.memberShareScore : item.ownerShareScore;
  const theirScore = owner ? item.memberScore : item.ownerScore;
  const theirScoreMeasured = owner ? item.memberScoreMeasured === true : item.ownerScoreMeasured === true;
  const theirLocationEnabled = owner ? item.memberShareLocation : item.ownerShareLocation;
  const theirLatitude = owner ? item.memberLatitude : item.ownerLatitude;
  const theirLongitude = owner ? item.memberLongitude : item.ownerLongitude;
  const theirLocationAt = owner ? item.memberLocationAt : item.ownerLocationAt;
  const myScore = owner ? item.ownerShareScore : item.memberShareScore;
  const myLocation = owner ? item.ownerShareLocation : item.memberShareLocation;
  const otherIsMinor = owner && item.memberAccountType === 'minor';
  const toggle = async (key: 'score' | 'location', enabled: boolean) => { setBusy(key); setMessage(''); try { await connection.setSharing(item, key, enabled); setMessage(key === 'location' && enabled ? 'Your current location was refreshed.' : 'Sharing preference updated.'); } catch (cause) { setMessage(cause instanceof Error ? cause.message : 'Sharing could not be updated.'); } finally { setBusy(''); } };
  const remove = async () => { setConfirmRemove(false); try { await connection.removeConnection(item); navigation.goBack(); } catch (cause) { setMessage(cause instanceof Error ? cause.message : 'Connection could not be removed.'); } };
  return <ScreenShell>
    <AppHeader title={name} onBack={() => navigation.goBack()} />
    <View style={styles.identity}><View style={styles.avatar}><Text style={styles.initial}>{name.slice(0, 1).toUpperCase()}</Text></View><View style={styles.fill}><Text style={styles.name}>{name}</Text><Text style={styles.body}>{item.kind === 'friend' ? 'Friend · Private connection' : otherIsMinor ? 'Family · Minor' : 'Family · Parent/Guardian'}</Text></View><View style={styles.badge}><Ionicons name={item.kind === 'friend' ? 'people-outline' : 'shield-checkmark-outline'} size={20} color={colors.accent} /></View></View>
    <View style={styles.scoreCard}><View><Text style={styles.score}>{theirScoreEnabled ? theirScore ?? 100 : '—'}</Text><Text style={styles.scoreLabel}>{theirScoreEnabled ? theirScoreMeasured ? 'SHARED SAFETY SCORE' : 'STARTER SAFETY SCORE' : 'SCORE PRIVATE'}</Text></View><View style={styles.scoreDivider} /><Text style={[styles.body, styles.fill]}>{theirScoreEnabled ? theirScoreMeasured ? 'Calculated from their completed measured drives.' : 'New accounts begin at 100. Completed measured drives update this score.' : `${name} has not shared a score with you.`}</Text></View>
    <Text style={styles.section}>Shared Location</Text>
    {theirLocationEnabled && theirLatitude != null && theirLongitude != null ? <><SharedLocationMap latitude={theirLatitude} longitude={theirLongitude} name={name} /><Text style={styles.body}>Current-location snapshot · Updated {theirLocationAt?.toDate().toLocaleString() ?? 'recently'}. This is not background tracking.</Text></> : <View style={styles.empty}><Ionicons name="location-outline" size={28} color={colors.accent} /><Text style={styles.title}>Location is private</Text><Text style={styles.body}>{name} controls whether a current-location snapshot is visible.</Text></View>}
    <Text style={styles.section}>What I Share</Text>
    <ShareSetting icon="speedometer-outline" label="My Safety Score" detail="Starts at 100, then follows measured drives." value={myScore} disabled={busy !== ''} onChange={value => void toggle('score', value)} />
    <ShareSetting icon="location-outline" label="My Current Location" detail="Shares one foreground GPS snapshot." value={myLocation} disabled={busy !== ''} onChange={value => void toggle('location', value)} />
    {myLocation ? <MotionPressable disabled={busy !== ''} style={styles.refresh} onPress={() => void toggle('location', true)}><Ionicons name="refresh" size={18} color={colors.accent} /><Text style={styles.refreshText}>Refresh My Shared Location</Text></MotionPressable> : null}
    {item.kind === 'family' && otherIsMinor ? <DrivingAppLimitsCard targetUid={item.memberUid} targetName={item.memberName} navigation={navigation} /> : null}
    {message ? <Text accessibilityRole="alert" style={styles.message}>{message}</Text> : null}
    <MotionPressable style={styles.remove} onPress={() => setConfirmRemove(true)}><Text style={styles.removeText}>Remove {item.kind === 'friend' ? 'Friend' : 'Family Connection'}</Text></MotionPressable>
    <ConfirmSheet visible={confirmRemove} title={`Remove ${name}?`} body={`This removes the ${item.kind} connection for both accounts. Shared score and location access will stop.`} confirmLabel="Remove connection" onCancel={() => setConfirmRemove(false)} onConfirm={() => void remove()} />
  </ScreenShell>;
}

function ShareSetting({ icon, label, detail, value, disabled, onChange }: { icon: keyof typeof Ionicons.glyphMap; label: string; detail: string; value: boolean; disabled: boolean; onChange: (value: boolean) => void }) {
  const { colors } = useAppearance(); const styles = useMemo(() => makeStyles(colors), [colors]);
  return <View style={styles.setting}><View style={styles.settingIcon}><Ionicons name={icon} size={20} color={colors.accent} /></View><View style={styles.fill}><Text style={styles.title}>{label}</Text><Text style={styles.body}>{detail}</Text></View><Switch accessibilityLabel={`Share ${label}`} value={value} disabled={disabled} onValueChange={onChange} trackColor={{ false: colors.surfaceMuted, true: colors.accent }} thumbColor="#FFFFFF" /></View>;
}

const makeStyles = (c: AppColors) => StyleSheet.create({
  fill: { flex: 1 }, identity: { flexDirection: 'row', gap: 14, alignItems: 'center', paddingVertical: 8 }, avatar: { width: 68, height: 68, borderRadius: 24, backgroundColor: c.accentSoft, borderWidth: 1, borderColor: c.borderStrong, alignItems: 'center', justifyContent: 'center' }, initial: { color: c.accent, fontFamily: 'Manrope_800ExtraBold', fontSize: 24 }, name: { color: c.text, fontFamily: 'Manrope_800ExtraBold', fontSize: 21 }, badge: { width: 42, height: 42, borderRadius: 14, backgroundColor: c.card, borderWidth: 1, borderColor: c.border, alignItems: 'center', justifyContent: 'center' },
  body: { color: c.textSecondary, fontSize: 11, lineHeight: 17, marginTop: 3 }, title: { color: c.text, fontFamily: 'Manrope_700Bold', fontSize: 14 }, section: { color: c.text, fontFamily: 'Manrope_800ExtraBold', fontSize: 18, marginTop: 8 }, scoreCard: { minHeight: 118, borderRadius: 24, padding: 20, backgroundColor: c.featureSurface, flexDirection: 'row', alignItems: 'center', gap: 18, borderWidth: 1, borderColor: c.borderStrong }, score: { color: c.featureText, fontFamily: 'Manrope_800ExtraBold', fontSize: 42, fontVariant: ['tabular-nums'] }, scoreLabel: { color: c.featureMuted, fontFamily: 'Manrope_700Bold', fontSize: 8, letterSpacing: .8 }, scoreDivider: { width: StyleSheet.hairlineWidth, height: 54, backgroundColor: c.featureMuted, opacity: .45 },
  empty: { minHeight: 145, borderRadius: 22, borderWidth: 1, borderStyle: 'dashed', borderColor: c.borderStrong, backgroundColor: c.card, alignItems: 'center', justifyContent: 'center', padding: 22, gap: 4 }, setting: { minHeight: 72, flexDirection: 'row', gap: 12, alignItems: 'center', padding: 14, borderRadius: 18, backgroundColor: c.card, borderWidth: 1, borderColor: c.border }, settingIcon: { width: 42, height: 42, borderRadius: 14, backgroundColor: c.accentSoft, alignItems: 'center', justifyContent: 'center' }, refresh: { minHeight: 48, borderRadius: 15, backgroundColor: c.accentSoft, flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center' }, refreshText: { color: c.accent, fontFamily: 'Manrope_700Bold', fontSize: 12 }, message: { color: c.text, fontSize: 11, lineHeight: 17, padding: 13, borderRadius: 14, backgroundColor: c.accentSoft }, remove: { minHeight: 50, alignItems: 'center', justifyContent: 'center' }, removeText: { color: c.danger, fontFamily: 'Manrope_700Bold', fontSize: 13 },
});

