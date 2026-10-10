import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { MotionPressable } from '../components/MotionPressable';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TripRouteSnapshot } from '../components/TripRouteSnapshot';
import { useDrives } from '../features/drives/DriveContext';
import type { SafetyEvent } from '../features/drives/types';
import type { RootStackParamList } from '../navigation/types';
import { useAppearance } from '../theme/AppearanceContext';
import type { AppColors } from '../theme/colors';
import { spacing } from '../theme/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'TripSummary'>;

function formatDuration(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remaining = seconds % 60;
  return minutes ? `${minutes}m ${remaining}s` : `${remaining}s`;
}

function eventIcon(event: SafetyEvent): keyof typeof Ionicons.glyphMap {
  if (event.type === 'road_hazard') return 'warning-outline';
  if (event.type === 'phone_detected') return 'phone-portrait-outline';
  if (event.type === 'eyes_closed') return 'eye-off-outline';
  return 'eye-outline';
}

export function TripSummaryScreen({ navigation, route }: Props) {
  const { colors: colors } = useAppearance();
  const styles = makeThemeStyles(colors);

  const { sessions } = useDrives();
  const session = sessions.find((item) => item.id === route.params.sessionId) ?? sessions[0];
  const hazards = session?.events.filter((event) => event.type === 'road_hazard') ?? [];
  const events = session?.events.filter((event) => event.type !== 'attention_restored') ?? [];
  const focusScore = session?.focusScore ?? 100;
  const duration = session?.durationSeconds ?? 0;
  const distance = session?.distanceMiles ?? 0;
  const status = focusScore >= 90 ? 'Focused drive' : focusScore >= 75 ? 'A few moments to review' : 'Attention needs review';
  const backHome = () => navigation.replace('ReturningHome', { afterDrive: true });

  return <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}><ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 120, gap: 12 }} showsVerticalScrollIndicator={false}>
    <View style={styles.header}><View style={styles.completeIcon}><Ionicons name="checkmark" size={23} color="#FFFFFF" /></View><Text style={styles.title}>Drive complete</Text><Text style={styles.subtitle}>{formatDuration(duration)} · {distance.toFixed(1)} mi · {session?.vehicleName ?? 'Toyota Prius'}</Text></View>

    <View style={styles.scorePanel}><View><Text style={styles.scoreValue}>{session?.attentionMeasured === false ? '—' : focusScore}</Text><Text style={styles.scoreLabel}>Focus score</Text></View><View style={styles.scoreDivider} /><View style={styles.scoreCopy}><Text style={styles.scoreTitle}>{session?.attentionMeasured === false ? 'Drive recorded' : status}</Text><Text style={styles.scoreText}>{events.length ? `${events.length} moment${events.length === 1 ? '' : 's'} logged for your review.` : session?.attentionMeasured === false ? 'Camera preview only. Attention scoring is not connected on this device yet.' : 'No attention alerts were recorded.'}</Text></View></View>

    <View style={styles.stats}><Stat icon="time-outline" value={formatDuration(duration)} label="Drive time" /><Stat icon="navigate-outline" value={`${distance.toFixed(1)} mi`} label="Distance" /><Stat icon="warning-outline" value={String(hazards.length)} label="Road reports" /></View>

    {session ? <View style={styles.sectionCard}><View style={styles.sectionHeader}><View><Text style={styles.sectionTitle}>Your route</Text><Text style={styles.sectionDescription}>{session.route.length > 1 ? `${session.route.length} GPS points recorded` : 'Not enough GPS data to draw this drive'}</Text></View></View><TripRouteSnapshot points={session.route} hazards={session.events} accent={colors.accent} background={colors.mapSurface} /></View> : null}

    <MotionPressable style={[styles.sectionCard, { flexDirection: 'row', alignItems: 'center', padding: 20 }]} onPress={() => navigation.navigate('DriveEvents', { sessionId: route.params.sessionId })}><Text style={[styles.sectionTitle, { flex: 1 }]}>Drive events</Text><Text style={{ color: colors.textSecondary, marginRight: 12 }}>{events.length}</Text><Ionicons name="chevron-forward" size={20} color={colors.accent} /></MotionPressable>
    </ScrollView><View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: colors.background, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 28, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border }}>
    <MotionPressable style={styles.done} scaleTo={0.96} onPress={backHome}><Text style={styles.doneText}>Return home</Text><Ionicons name="arrow-forward" size={18} color="#FFFFFF" /></MotionPressable>
  </View></SafeAreaView>;
}

function Stat({ icon, value, label }: { icon: keyof typeof Ionicons.glyphMap; value: string; label: string }) {
  const { colors: colors } = useAppearance();
  const styles = makeThemeStyles(colors);
 return <View style={styles.stat}><Ionicons name={icon} size={16} color={colors.accent} /><Text style={styles.statValue}>{value}</Text><Text style={styles.statLabel}>{label}</Text></View>; }

const makeThemeStyles = (colors: AppColors) => StyleSheet.create({
  header: { alignItems: 'center', paddingTop: spacing.sm, paddingBottom: spacing.sm }, completeIcon: { width: 48, height: 48, borderRadius: 16, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center', marginBottom: 12, shadowColor: colors.accent, shadowOpacity: .18, shadowRadius: 10, shadowOffset: { width: 0, height: 5 } }, title: { color: colors.text, fontFamily: 'Manrope_800ExtraBold', fontSize: 27, letterSpacing: -.7 }, subtitle: { color: colors.textSecondary, fontSize: 10, marginTop: 5 },
  scorePanel: { minHeight: 112, borderRadius: 22, backgroundColor: colors.card, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border, paddingHorizontal: 18, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', gap: 17 }, scoreValue: { color: colors.text, fontFamily: 'Manrope_800ExtraBold', fontSize: 43, lineHeight: 46, letterSpacing: -1.8 }, scoreLabel: { color: colors.accent, fontFamily: 'Manrope_700Bold', fontSize: 8, letterSpacing: .7 }, scoreDivider: { width: StyleSheet.hairlineWidth, height: 54, backgroundColor: colors.border }, scoreCopy: { flex: 1 }, scoreTitle: { color: colors.text, fontFamily: 'Manrope_700Bold', fontSize: 14 }, scoreText: { color: colors.textSecondary, fontSize: 9, lineHeight: 14, marginTop: 4 },
  stats: { flexDirection: 'row', gap: 8 }, stat: { flex: 1, minHeight: 78, borderRadius: 18, backgroundColor: colors.card, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', gap: 3 }, statValue: { color: colors.text, fontFamily: 'Manrope_800ExtraBold', fontSize: 13 }, statLabel: { color: colors.textTertiary, fontSize: 8 },
  sectionCard: { borderRadius: 22, backgroundColor: colors.card, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border, padding: 10, gap: 11 }, sectionHeader: { paddingHorizontal: 5, paddingTop: 3, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, sectionTitle: { color: colors.text, fontFamily: 'Manrope_800ExtraBold', fontSize: 16 }, sectionDescription: { color: colors.textSecondary, fontSize: 8, marginTop: 3 }, staticPill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 6, borderRadius: 10, backgroundColor: colors.accentSoft }, staticText: { color: colors.accent, fontFamily: 'Manrope_700Bold', fontSize: 7, letterSpacing: .5 },
  timelineHeader: { flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: spacing.sm }, eventCount: { minWidth: 22, height: 22, borderRadius: 11, backgroundColor: colors.surfaceMuted, color: colors.textSecondary, fontFamily: 'Manrope_700Bold', fontSize: 9, textAlign: 'center', lineHeight: 22 }, timeline: { borderRadius: 22, backgroundColor: colors.card, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border, paddingHorizontal: 14, paddingVertical: 15 },
  eventRow: { flexDirection: 'row', gap: 11, minHeight: 68 }, eventRail: { width: 38, alignItems: 'center' }, eventDot: { width: 36, height: 36, borderRadius: 13, backgroundColor: colors.accentSoft, alignItems: 'center', justifyContent: 'center' }, eventDotHazard: { backgroundColor: '#FFF3D8' }, railLine: { width: StyleSheet.hairlineWidth, flex: 1, backgroundColor: colors.border, marginVertical: 5 }, eventCopy: { flex: 1, paddingTop: 2, paddingBottom: 14 }, eventTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }, eventTitle: { flex: 1, color: colors.text, fontFamily: 'Manrope_700Bold', fontSize: 11 }, eventTime: { color: colors.textTertiary, fontSize: 8 }, eventText: { color: colors.textSecondary, fontSize: 9, lineHeight: 14, marginTop: 4 },
  emptyEvents: { minHeight: 76, borderRadius: 20, backgroundColor: colors.card, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12 }, emptyTitle: { color: colors.text, fontFamily: 'Manrope_700Bold', fontSize: 11 }, emptyText: { color: colors.textSecondary, fontSize: 8, marginTop: 3 }, done: { minHeight: 54, borderRadius: 17, backgroundColor: colors.accent, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: spacing.sm }, doneText: { color: colors.onAccent, fontFamily: 'Manrope_800ExtraBold', fontSize: 13 },
});
