import { Ionicons } from '@expo/vector-icons';
import { NavigationProp, useNavigation, useRoute } from '@react-navigation/native';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppHeader } from '../components/AppHeader';
import { ConfirmSheet } from '../components/ConfirmSheet';
import { MotionPressable } from '../components/MotionPressable';
import { Reveal } from '../components/Reveal';
import { ScreenShell } from '../components/ScreenShell';
import { formatDuration } from '../features/drives/formatDuration';
import { useDrives } from '../features/drives/DriveContext';
import type { RootStackParamList } from '../navigation/types';
import { useAppearance } from '../theme/AppearanceContext';
import type { AppColors } from '../theme/colors';

export function DrivesScreen() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const route = useRoute();
  const { sessions, deleteTrip, clearTrips, persistenceError } = useDrives();
  const { colors } = useAppearance();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [deleting, setDeleting] = useState<string | null>(null);
  const measured = sessions.filter(trip => trip.attentionMeasured);
  const miles = sessions.reduce((total, item) => total + item.distanceMiles, 0);
  const average = measured.length ? Math.round(measured.reduce((total, item) => total + item.focusScore, 0) / measured.length) : 100;

  return <ScreenShell>
    <AppHeader title="Activity" eyebrow="Private trip intelligence. Camera frames are never retained." onBack={route.name === 'Drives' ? () => navigation.goBack() : undefined} />
    {persistenceError ? <Text accessibilityRole="alert" style={{ color: colors.danger }}>{persistenceError}</Text> : null}
    <Reveal>
      <View style={styles.scorePanel}>
        <View style={styles.scoreGlow} />
        <View style={styles.scoreLead}>
          <Text style={styles.scoreValue}>{average}</Text>
          <View><Text style={styles.scoreLabel}>{measured.length ? 'AVERAGE SAFETY SCORE' : 'STARTER SAFETY SCORE'}</Text><Text style={styles.scoreNote}>{measured.length ? `${measured.length} measured drive${measured.length === 1 ? '' : 's'}` : 'Your measured drives will shape this score.'}</Text></View>
        </View>
        <View style={styles.statsRow}>
          <Metric icon="navigate-outline" value={miles.toFixed(1)} label="miles" styles={styles} />
          <View style={styles.statDivider} />
          <Metric icon="car-sport-outline" value={String(sessions.length)} label="trips" styles={styles} />
          <View style={styles.statDivider} />
          <Metric icon="eye-outline" value={String(measured.length)} label="measured" styles={styles} />
        </View>
      </View>
    </Reveal>

    <View style={styles.sectionHeader}>
      <View><Text style={styles.section}>Recent drives</Text><Text style={styles.sectionHint}>Open a trip for its route, events, and coaching.</Text></View>
      {sessions.length ? <MotionPressable accessibilityLabel="Clear all trips" style={styles.clearButton} onPress={() => setDeleting('all')}><Text style={styles.clearText}>Clear</Text></MotionPressable> : null}
    </View>

    {!sessions.length ? <View style={styles.empty}>
      <View style={styles.emptyIcon}><Ionicons name="map-outline" size={25} color={colors.accent} /></View>
      <Text style={styles.emptyTitle}>Your first drive starts here</Text>
      <Text style={styles.emptyBody}>Completed drives appear as a private timeline with distance, duration, and measured attention.</Text>
    </View> : <View style={styles.timeline}>{sessions.map((session, index) => <View key={session.id} style={styles.timelineRow}>
      <View style={styles.timelineRail}><View style={[styles.timelineDot, { backgroundColor: session.focusScore >= 90 ? colors.accent : colors.amber }]} />{index < sessions.length - 1 ? <View style={styles.timelineLine} /> : null}</View>
      <Pressable accessibilityRole="button" style={styles.tripButton} onPress={() => navigation.navigate('TripDetail', { sessionId: session.id })}>
        <View style={styles.tripCopy}><Text style={styles.tripDate}>{new Date(session.startedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</Text><Text style={styles.tripTitle}>{session.vehicleName}{session.interrupted ? ' · Recovered' : ''}</Text><Text style={styles.tripMeta}>{formatDuration(session.durationSeconds)} · {session.distanceMiles.toFixed(1)} mi</Text></View>
        <View style={styles.tripScore}><Text style={styles.tripScoreValue}>{session.attentionMeasured ? session.focusScore : 100}</Text><Text style={styles.tripScoreLabel}>{session.attentionMeasured ? 'SCORE' : 'STARTER'}</Text></View>
        <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
      </Pressable>
      <MotionPressable accessibilityLabel={'Delete trip in ' + session.vehicleName} style={styles.deleteButton} onPress={() => setDeleting(session.id)}><Ionicons name="trash-outline" size={18} color={colors.danger} /></MotionPressable>
    </View>)}</View>}

    <ConfirmSheet visible={deleting !== null} title={deleting === 'all' ? 'Clear your trip history?' : 'Delete this trip?'} body={deleting === 'all' ? 'All saved trips on this device will be removed. This cannot be undone. Any synced family summaries will be updated when connected.' : 'This trip and its route will be removed from your history. This cannot be undone.'} confirmLabel={deleting === 'all' ? 'Clear all trips' : 'Delete trip'} onCancel={() => setDeleting(null)} onConfirm={() => { if (deleting === 'all') clearTrips(); else if (deleting) deleteTrip(deleting); setDeleting(null); }} />
  </ScreenShell>;
}

function Metric({ icon, value, label, styles }: { icon: keyof typeof Ionicons.glyphMap; value: string; label: string; styles: ReturnType<typeof makeStyles> }) {
  return <View style={styles.metric}><Ionicons name={icon} size={16} color="rgba(230,250,239,.72)" /><Text style={styles.metricValue}>{value}</Text><Text style={styles.metricLabel}>{label}</Text></View>;
}

const makeStyles = (c: AppColors) => StyleSheet.create({
  scorePanel: { minHeight: 236, borderRadius: 28, padding: 22, overflow: 'hidden', backgroundColor: c.featureSurface, shadowColor: c.shadow, shadowOpacity: .16, shadowRadius: 24, shadowOffset: { width: 0, height: 12 }, elevation: 5 },
  scoreGlow: { position: 'absolute', width: 250, height: 250, borderRadius: 125, right: -86, top: -104, backgroundColor: 'rgba(99,207,147,.15)' },
  scoreLead: { flex: 1, flexDirection: 'row', alignItems: 'flex-end', gap: 16, paddingBottom: 24 },
  scoreValue: { color: '#FFFFFF', fontFamily: 'Manrope_800ExtraBold', fontSize: 72, lineHeight: 76, letterSpacing: -4, fontVariant: ['tabular-nums'] },
  scoreLabel: { color: '#A9DFC1', fontFamily: 'Manrope_800ExtraBold', fontSize: 8, letterSpacing: 1.1, maxWidth: 138 },
  scoreNote: { color: 'rgba(234,249,241,.68)', fontSize: 10, lineHeight: 15, marginTop: 6, maxWidth: 145 },
  statsRow: { minHeight: 64, borderTopWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(229,250,238,.22)', flexDirection: 'row', alignItems: 'center', paddingTop: 14 },
  metric: { flex: 1, alignItems: 'center', gap: 2 },
  metricValue: { color: '#FFFFFF', fontFamily: 'Manrope_800ExtraBold', fontSize: 15 },
  metricLabel: { color: 'rgba(230,250,239,.62)', fontSize: 9 },
  statDivider: { width: StyleSheet.hairlineWidth, height: 34, backgroundColor: 'rgba(229,250,238,.2)' },
  sectionHeader: { marginTop: 18, marginBottom: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  section: { color: c.text, fontFamily: 'Manrope_800ExtraBold', fontSize: 20, letterSpacing: -.35 },
  sectionHint: { color: c.textSecondary, fontSize: 10, lineHeight: 15, marginTop: 3 },
  clearButton: { minHeight: 44, minWidth: 52, paddingHorizontal: 12, alignItems: 'center', justifyContent: 'center' },
  clearText: { color: c.danger, fontFamily: 'Manrope_700Bold', fontSize: 12 },
  timeline: { marginTop: 6 },
  timelineRow: { minHeight: 84, flexDirection: 'row', alignItems: 'stretch' },
  timelineRail: { width: 22, alignItems: 'center' },
  timelineDot: { width: 10, height: 10, borderRadius: 5, marginTop: 31, borderWidth: 2, borderColor: c.background },
  timelineLine: { width: 1, flex: 1, backgroundColor: c.borderStrong, marginTop: 2 },
  tripButton: { flex: 1, minHeight: 76, marginBottom: 8, paddingVertical: 12, paddingHorizontal: 14, borderRadius: 18, backgroundColor: c.card, borderWidth: StyleSheet.hairlineWidth, borderColor: c.border, flexDirection: 'row', alignItems: 'center', gap: 10 },
  tripCopy: { flex: 1 },
  tripDate: { color: c.accent, fontFamily: 'Manrope_800ExtraBold', fontSize: 8, letterSpacing: .8, textTransform: 'uppercase' },
  tripTitle: { color: c.text, fontFamily: 'Manrope_700Bold', fontSize: 14, marginTop: 3 },
  tripMeta: { color: c.textSecondary, fontSize: 10, marginTop: 3 },
  tripScore: { alignItems: 'flex-end' },
  tripScoreValue: { color: c.text, fontFamily: 'Manrope_800ExtraBold', fontSize: 19 },
  tripScoreLabel: { color: c.textTertiary, fontFamily: 'Manrope_700Bold', fontSize: 7, letterSpacing: .8 },
  deleteButton: { width: 44, minHeight: 76, marginBottom: 8, alignItems: 'center', justifyContent: 'center' },
  empty: { minHeight: 210, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28 },
  emptyIcon: { width: 56, height: 56, borderRadius: 20, backgroundColor: c.accentSoft, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { color: c.text, fontFamily: 'Manrope_800ExtraBold', fontSize: 17, marginTop: 14 },
  emptyBody: { color: c.textSecondary, fontSize: 11, lineHeight: 17, textAlign: 'center', marginTop: 6 },
});
