import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { RouteMap } from '../components/RouteMap';
import { ScreenShell } from '../components/ScreenShell';
import { SurfaceCard } from '../components/SurfaceCard';
import { useDrives } from '../features/drives/DriveContext';
import type { RootStackParamList } from '../navigation/types';
import { darkColors as colors } from '../theme/colors';
import { spacing } from '../theme/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'TripSummary'>;

export function TripSummaryScreen({ navigation, route }: Props) {
  const { sessions } = useDrives();
  const session = sessions.find((item) => item.id === route.params.sessionId) ?? sessions[0];
  const hazards = session?.events.filter((event) => event.type === 'road_hazard') ?? [];
  const pinnedHazards = hazards.filter((event) => event.latitude != null && event.longitude != null);
  const events = session?.events.filter((event) => event.type !== 'attention_restored') ?? [];

  return <ScreenShell tone="dark">
    <View style={styles.completeIcon}><Ionicons name="checkmark" size={24} color={colors.onAccent} /></View>
    <Text style={styles.eyebrow}>DRIVE COMPLETE</Text><Text style={styles.title}>Drive saved.</Text>
    <Text style={styles.subtitle}>Your safety score, route, attention events, and driver-reported hazards are ready to review.</Text>
    <SurfaceCard tone="dark" style={styles.scoreCard}><View><Text style={styles.scoreValue}>{session?.focusScore ?? 91}</Text><Text style={styles.scoreLabel}>FOCUS SCORE</Text></View><View style={styles.scoreCopy}><Text style={styles.scoreTone}>{(session?.focusScore ?? 91) >= 90 ? 'Strong drive' : 'Review suggested'}</Text><Text style={styles.scoreDetail}>{events.length} event{events.length === 1 ? '' : 's'} · {hazards.length} road report{hazards.length === 1 ? '' : 's'}</Text></View></SurfaceCard>
    <View style={styles.stats}><Stat icon="time-outline" value={`${Math.max(1, Math.round((session?.durationSeconds ?? 20) / 60))}m`} label="Duration" /><Stat icon="navigate-outline" value={`${session?.distanceMiles.toFixed(1) ?? '0.0'}`} label="Miles" /><Stat icon="warning-outline" value={String(hazards.length)} label="Hazards" /></View>
    {session ? <SurfaceCard tone="dark" style={styles.mapCard}><View style={styles.sectionRow}><Text style={styles.section}>Trip map</Text><Text style={styles.mapCount}>{pinnedHazards.length ? `${pinnedHazards.length} pinned` : 'Clear route'}</Text></View><RouteMap points={session.route} hazards={session.events} accent={colors.accent} background={colors.mapSurface} /><View style={styles.legend}><Legend color={colors.amber} label="Object" /><Legend color={colors.blue} label="Police" /><Legend color={colors.danger} label="Crash" /></View></SurfaceCard> : null}
    <Text style={styles.section}>Drive timeline</Text>
    {events.slice(-3).map((event) => <SurfaceCard tone="dark" key={event.id} style={styles.event}><View style={[styles.eventIcon, { backgroundColor: event.type === 'road_hazard' ? colors.accentSoft : colors.surfaceMuted }]}><Ionicons name={event.type === 'road_hazard' ? 'location-outline' : 'eye-outline'} size={18} color={event.type === 'road_hazard' ? colors.accent : colors.textSecondary} /></View><View style={styles.fill}><Text style={styles.eventTitle}>{event.title}</Text><Text style={styles.eventText}>{event.detail}</Text></View></SurfaceCard>)}
    <Pressable style={styles.done} onPress={() => navigation.navigate('MainTabs')}><Text style={styles.doneText}>Back to home</Text><Ionicons name="arrow-forward" size={18} color={colors.onAccent} /></Pressable>
  </ScreenShell>;
}

function Stat({ icon, value, label }: { icon: keyof typeof Ionicons.glyphMap; value: string; label: string }) { return <SurfaceCard tone="dark" style={styles.stat}><Ionicons name={icon} size={16} color={colors.accent} /><Text style={styles.statValue}>{value}</Text><Text style={styles.statLabel}>{label}</Text></SurfaceCard>; }
function Legend({ color, label }: { color: string; label: string }) { return <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: color }]} /><Text style={styles.legendText}>{label}</Text></View>; }

const styles = StyleSheet.create({
  completeIcon: { width: 48, height: 48, borderRadius: 16, backgroundColor: colors.accent, alignSelf: 'center', alignItems: 'center', justifyContent: 'center', marginTop: spacing.md },
  eyebrow: { color: colors.accent, fontFamily: 'Manrope_700Bold', fontSize: 9, letterSpacing: 1.4, textAlign: 'center', marginTop: 9 }, title: { color: colors.text, fontFamily: 'Manrope_800ExtraBold', fontSize: 30, letterSpacing: -1, textAlign: 'center' }, subtitle: { color: colors.textSecondary, fontSize: 11, lineHeight: 17, textAlign: 'center', paddingHorizontal: 12 },
  scoreCard: { flexDirection: 'row', alignItems: 'center', gap: 18, marginTop: spacing.sm }, scoreValue: { color: colors.text, fontFamily: 'Manrope_800ExtraBold', fontSize: 46, letterSpacing: -2 }, scoreLabel: { color: colors.accent, fontFamily: 'Manrope_700Bold', fontSize: 8, letterSpacing: 1 }, scoreCopy: { flex: 1, borderLeftWidth: StyleSheet.hairlineWidth, borderColor: colors.border, paddingLeft: 18 }, scoreTone: { color: colors.text, fontFamily: 'Manrope_700Bold', fontSize: 15 }, scoreDetail: { color: colors.textSecondary, fontSize: 10, marginTop: 5 },
  stats: { flexDirection: 'row', gap: 8 }, stat: { flex: 1, alignItems: 'center', padding: 11, gap: 3 }, statValue: { color: colors.text, fontFamily: 'Manrope_800ExtraBold', fontSize: 15 }, statLabel: { color: colors.textTertiary, fontSize: 8 },
  mapCard: { padding: 10, gap: 9 }, sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 5 }, section: { color: colors.text, fontFamily: 'Manrope_800ExtraBold', fontSize: 16, marginTop: spacing.sm }, mapCount: { color: colors.accent, fontFamily: 'Manrope_700Bold', fontSize: 9 }, legend: { flexDirection: 'row', gap: 14, paddingHorizontal: 5 }, legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 }, legendDot: { width: 7, height: 7, borderRadius: 4 }, legendText: { color: colors.textSecondary, fontSize: 8 },
  event: { flexDirection: 'row', gap: 11, alignItems: 'flex-start' }, eventIcon: { width: 38, height: 38, borderRadius: 13, alignItems: 'center', justifyContent: 'center' }, fill: { flex: 1 }, eventTitle: { color: colors.text, fontFamily: 'Manrope_700Bold', fontSize: 12 }, eventText: { color: colors.textSecondary, fontSize: 9, lineHeight: 14, marginTop: 3 },
  done: { minHeight: 54, borderRadius: 17, backgroundColor: colors.accent, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: spacing.sm }, doneText: { color: colors.onAccent, fontFamily: 'Manrope_800ExtraBold', fontSize: 14 },
});
