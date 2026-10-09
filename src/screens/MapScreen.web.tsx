import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { RouteMap } from '../components/RouteMap';
import { ScreenShell } from '../components/ScreenShell';
import { SurfaceCard } from '../components/SurfaceCard';
import { useDrives } from '../features/drives/DriveContext';
import { useAppearance } from '../theme/AppearanceContext';
import type { AppColors } from '../theme/colors';

export function MapScreen() {
  const { activeSession, sessions } = useDrives(); const { colors } = useAppearance(); const styles = useMemo(() => makeStyles(colors), [colors]); const trip = activeSession ?? sessions[0]; const hazards = trip?.events.filter((event) => event.type === 'road_hazard') ?? [];
  return <ScreenShell><View style={styles.header}><View><Text style={styles.eyebrow}>ROAD OVERVIEW</Text><Text style={styles.title}>CUBO Map</Text></View><View style={styles.webPill}><Ionicons name="desktop-outline" size={13} color={colors.accent} /><Text style={styles.webText}>WEB PREVIEW</Text></View></View><SurfaceCard style={styles.mapCard}><RouteMap points={trip?.route ?? []} hazards={hazards} accent={colors.accent} background={colors.mapSurface} /></SurfaceCard><View style={styles.stats}><SurfaceCard style={styles.stat}><Text style={styles.statValue}>{trip?.route.length ?? 0}</Text><Text style={styles.statLabel}>GPS points</Text></SurfaceCard><SurfaceCard style={styles.stat}><Text style={styles.statValue}>{hazards.length}</Text><Text style={styles.statLabel}>Hazard reports</Text></SurfaceCard></View><Text style={styles.note}>The iPhone app uses a real Apple Maps street layer. Web uses this privacy-safe route preview.</Text></ScreenShell>;
}
const makeStyles = (c: AppColors) => StyleSheet.create({ header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }, eyebrow: { color: c.accent, fontFamily: 'Manrope_700Bold', fontSize: 8, letterSpacing: 1 }, title: { color: c.text, fontFamily: 'Manrope_800ExtraBold', fontSize: 28 }, webPill: { flexDirection: 'row', gap: 5, padding: 8, borderRadius: 12, backgroundColor: c.accentSoft }, webText: { color: c.accent, fontFamily: 'Manrope_700Bold', fontSize: 7 }, mapCard: { padding: 8 }, stats: { flexDirection: 'row', gap: 8 }, stat: { flex: 1 }, statValue: { color: c.text, fontFamily: 'Manrope_800ExtraBold', fontSize: 22 }, statLabel: { color: c.textSecondary, fontSize: 9 }, note: { color: c.textTertiary, fontSize: 9, lineHeight: 14, textAlign: 'center' } });
