import { Ionicons } from '@expo/vector-icons';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { useMemo } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { ScreenShell } from '../components/ScreenShell';
import { useDrives } from '../features/drives/DriveContext';
import type { RootStackParamList } from '../navigation/types';
import { useAppearance } from '../theme/AppearanceContext';
import type { AppColors } from '../theme/colors';
import { spacing } from '../theme/theme';
import { useProfile } from '../features/profile/ProfileContext';
import { useVehicles } from '../features/vehicles/VehicleContext';

export function HomeScreen() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const { activeSession, sessions } = useDrives();
  const { profile } = useProfile();
  const { vehicles } = useVehicles();
  const primaryVehicle = vehicles.find((vehicle) => vehicle.primary) ?? vehicles[0];
  const { colors } = useAppearance();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const latest = sessions[0];

  return <ScreenShell>
    <View style={styles.header}>
      <View><Text style={styles.greeting}>Good evening, {profile.name.split(' ')[0]}</Text><Text style={styles.title}>Ready to drive?</Text></View>
      <Pressable style={styles.profileButton} onPress={() => navigation.navigate('Profile')}>{profile.photoUri ? <Image source={{ uri: profile.photoUri }} style={styles.profileImage} /> : <Text style={styles.initials}>{profile.initials}</Text>}</Pressable>
    </View>

    <Pressable style={styles.vehicleSelector} onPress={() => navigation.navigate('Garage')}>
      <Ionicons name="car-outline" size={19} color={colors.text} />
      <View style={styles.fill}><Text style={styles.vehicleName}>{primaryVehicle ? `${primaryVehicle.make} ${primaryVehicle.model}` : 'Choose a vehicle'}</Text><Text style={styles.vehicleMeta}>CUBO Cruise 01 connected</Text></View>
      <View style={styles.onlineDot} /><Ionicons name="chevron-forward" size={17} color={colors.textTertiary} />
    </Pressable>

    <Pressable onPress={() => navigation.navigate('LiveDrive')}><LinearGradient colors={[colors.accent, colors.accentSecondary]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.startButton}>
      <View><Text style={styles.startTitle}>{activeSession ? 'Return to drive' : 'Start drive'}</Text><Text style={styles.startText}>Camera and road monitoring will begin</Text></View>
      <View style={styles.startIcon}><Ionicons name="arrow-forward" size={22} color={colors.onAccent} /></View>
    </LinearGradient></Pressable>

    <Text style={styles.sectionTitle}>Safety at a glance</Text>
    <View style={styles.summary}>
      <View style={styles.summaryItem}><Text style={styles.summaryValue}>{latest?.focusScore ?? 92}</Text><Text style={styles.summaryLabel}>Latest focus score</Text></View>
      <View style={styles.divider} />
      <View style={styles.summaryItem}><Text style={styles.summaryValue}>{sessions.length}</Text><Text style={styles.summaryLabel}>Drives recorded</Text></View>
    </View>

    <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>Recent drive</Text><Pressable onPress={() => navigation.navigate('Drives')}><Text style={styles.link}>See history</Text></Pressable></View>
    <Pressable style={styles.row} onPress={() => navigation.navigate('Drives')}>
      <View style={styles.score}><Text style={styles.scoreText}>{latest?.focusScore ?? 92}</Text></View>
      <View style={styles.fill}><Text style={styles.rowTitle}>{latest?.vehicleName ?? (primaryVehicle ? `${primaryVehicle.make} ${primaryVehicle.model}` : 'No vehicle')}</Text><Text style={styles.rowMeta}>{latest?.distanceMiles.toFixed(1) ?? '8.4'} miles · {Math.max(1, Math.round((latest?.durationSeconds ?? 960) / 60))} minutes</Text></View>
      <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
    </Pressable>

    <Pressable style={styles.manageRow} onPress={() => navigation.navigate('Garage')}>
      <Ionicons name="hardware-chip-outline" size={20} color={colors.textSecondary} />
      <View style={styles.fill}><Text style={styles.rowTitle}>Vehicle and device</Text><Text style={styles.rowMeta}>Camera ready · GPS connected</Text></View>
      <Text style={styles.link}>Manage</Text>
    </Pressable>
  </ScreenShell>;
}

const makeStyles = (colors: AppColors) => StyleSheet.create({
  header: { paddingTop: spacing.lg, paddingBottom: spacing.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  greeting: { color: colors.textSecondary, fontSize: 13, fontFamily: 'Manrope_500Medium' }, title: { color: colors.text, fontSize: 28, fontWeight: '800', fontFamily: 'Manrope_800ExtraBold', letterSpacing: -0.8, marginTop: 3 },
  profileButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.accentSoft, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }, profileImage: { width: '100%', height: '100%' }, initials: { color: colors.accent, fontSize: 12, fontWeight: '700', fontFamily: 'Manrope_700Bold' },
  vehicleSelector: { minHeight: 62, flexDirection: 'row', alignItems: 'center', gap: 11, paddingHorizontal: 14, paddingVertical: 11, borderRadius: 16, backgroundColor: colors.card, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border },
  fill: { flex: 1 }, vehicleName: { color: colors.text, fontSize: 14, fontWeight: '700' }, vehicleMeta: { color: colors.textSecondary, fontSize: 11, marginTop: 3 }, onlineDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.gaugeProgress },
  startButton: { minHeight: 108, borderRadius: 20, padding: spacing.lg, backgroundColor: colors.accent, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.sm }, startTitle: { color: colors.onAccent, fontSize: 24, fontWeight: '800', fontFamily: 'Manrope_800ExtraBold' }, startText: { color: colors.onAccent, opacity: .7, fontSize: 11, marginTop: 6 }, startIcon: { width: 42, height: 42, borderRadius: 13, backgroundColor: 'rgba(255,255,255,0.28)', alignItems: 'center', justifyContent: 'center' },
  sectionTitle: { color: colors.text, fontSize: 16, fontWeight: '700', fontFamily: 'Manrope_700Bold', marginTop: spacing.lg }, sectionHeader: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' }, link: { color: colors.accent, fontSize: 12, fontWeight: '700' },
  summary: { flexDirection: 'row', alignItems: 'stretch', padding: spacing.md, borderRadius: 18, backgroundColor: colors.card, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border }, summaryItem: { flex: 1 }, summaryValue: { color: colors.text, fontSize: 26, fontWeight: '700' }, summaryLabel: { color: colors.textSecondary, fontSize: 11, marginTop: 4 }, divider: { width: StyleSheet.hairlineWidth, backgroundColor: colors.border, marginHorizontal: spacing.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: spacing.md, borderRadius: 18, backgroundColor: colors.card, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border }, score: { width: 44, height: 44, borderRadius: 14, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' }, scoreText: { color: colors.success, fontSize: 16, fontWeight: '800' }, rowTitle: { color: colors.text, fontSize: 14, fontWeight: '700' }, rowMeta: { color: colors.textSecondary, fontSize: 11, marginTop: 4 },
  manageRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: spacing.md, borderRadius: 18, backgroundColor: colors.card, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border },
});
