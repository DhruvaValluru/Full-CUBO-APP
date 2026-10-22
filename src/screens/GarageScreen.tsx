import { Ionicons } from '@expo/vector-icons';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AppHeader } from '../components/AppHeader';
import { ScreenShell } from '../components/ScreenShell';
import { SurfaceCard } from '../components/SurfaceCard';
import { VehicleArt } from '../components/VehicleArt';
import { VehicleColorSheet } from '../components/VehicleColorSheet';
import { useVehicles } from '../features/vehicles/VehicleContext';
import type { RootStackParamList } from '../navigation/types';
import { useAppearance } from '../theme/AppearanceContext';
import type { AppColors } from '../theme/colors';
import { spacing } from '../theme/theme';

export function GarageScreen() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>(); const { vehicles, setPrimary, deleteVehicle, updateVehicle } = useVehicles(); const [confirmDelete, setConfirmDelete] = useState<string | null>(null); const { colors } = useAppearance(); const styles = useMemo(() => makeStyles(colors), [colors]);
  const [colorVehicleId, setColorVehicleId] = useState<string | null>(null);
  const colorVehicle = vehicles.find(vehicle => vehicle.id === colorVehicleId);
  return <ScreenShell><AppHeader title="Your garage" eyebrow="Vehicles" onBack={navigation.getState().type === 'tab' ? undefined : () => navigation.goBack()} /><Text style={styles.subtitle}>Manage your saved vehicles.</Text>
    <View style={styles.sectionRow}><Text style={styles.section}>Saved vehicles</Text><Text style={styles.count}>{vehicles.length}</Text></View>
    {!vehicles.length ? <SurfaceCard style={styles.empty}><Ionicons name="car-outline" size={28} color={colors.textTertiary} /><Text style={styles.vehicleTitle}>Your garage is empty</Text><Text style={styles.detail}>Add a vehicle to begin a drive.</Text></SurfaceCard> : vehicles.map((vehicle) => <SurfaceCard key={vehicle.id} style={styles.vehicleCard}>
      <View style={styles.vehicleTop}>
        <Pressable accessibilityRole="button" accessibilityLabel={`Change color for ${vehicle.make} ${vehicle.model}`} onPress={() => setColorVehicleId(vehicle.id)} style={{ width: 76, height: 68, borderRadius: 16, backgroundColor: colors.accentSoft, alignItems: 'center', justifyContent: 'center' }}>
          <VehicleArt make={vehicle.make} model={vehicle.model} paint={vehicle.paint} width={76} height={56} />
          <View pointerEvents="none" style={{ position: 'absolute', right: 0, bottom: 0, width: 28, height: 28, borderRadius: 14, backgroundColor: colors.accent, borderWidth: 2, borderColor: colors.card, alignItems: 'center', justifyContent: 'center' }}><Ionicons name="pencil" size={13} color={colors.onAccent} /></View>
        </Pressable>
        <View style={styles.fill}><Text style={styles.vehicleTitle}>{vehicle.make} {vehicle.model}</Text><Text style={styles.detail}>{vehicle.year || 'Year not set'} · {vehicle.plate || vehicle.nickname}</Text></View>
        {vehicle.primary ? <View style={styles.primaryPill}><Text style={styles.primaryText}>SELECTED</Text></View> : null}
      </View>
      <View style={styles.vehicleActions}>
        {!vehicle.primary ? <Pressable style={[styles.secondaryButton, { minHeight: 44 }]} onPress={() => setPrimary(vehicle.id)}><Text style={styles.secondaryText}>Select</Text></Pressable> : <View style={styles.primarySpacer} />}
        <Pressable accessibilityRole="button" accessibilityLabel={`View vehicle details for ${vehicle.make} ${vehicle.model}`} style={[styles.iconButton, { width: 44, height: 44 }]} onPress={() => navigation.navigate('VehicleDetail', { vehicleId: vehicle.id })}><Ionicons name="eye-outline" size={18} color={colors.text} /></Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel={`Remove ${vehicle.make} ${vehicle.model}`} style={[styles.iconButton, { width: 44, height: 44 }]} onPress={() => setConfirmDelete(vehicle.id)}><Ionicons name="trash-outline" size={18} color={colors.danger} /></Pressable>
      </View>
      {confirmDelete === vehicle.id ? <View style={styles.confirm}><Text style={styles.confirmText}>Remove {vehicle.make} {vehicle.model}?</Text><Pressable onPress={() => setConfirmDelete(null)}><Text style={styles.cancel}>Cancel</Text></Pressable><Pressable onPress={() => { deleteVehicle(vehicle.id); setConfirmDelete(null); }}><Text style={styles.delete}>Delete</Text></Pressable></View> : null}
    </SurfaceCard>)}
    {colorVehicle && <VehicleColorSheet key={colorVehicle.id} vehicle={colorVehicle} onClose={() => setColorVehicleId(null)} onSave={paint => { const { id, primary, ...details } = colorVehicle; updateVehicle(id, { ...details, paint }); setColorVehicleId(null); }} />}
    <Pressable accessibilityRole="button" accessibilityLabel="Add vehicle" style={{ minHeight: 64, borderRadius: 18, borderWidth: 1, borderStyle: 'dashed', borderColor: colors.accent, backgroundColor: colors.accentSoft, justifyContent: 'center', alignItems: 'center', marginTop: 12 }} onPress={() => navigation.navigate('AddVehicle')}><Ionicons name="add" size={28} color={colors.accent} /></Pressable>
  </ScreenShell>;
}

const makeStyles = (c: AppColors) => StyleSheet.create({ add: { width: 38, height: 38, borderRadius: 12, backgroundColor: c.accent, alignItems: 'center', justifyContent: 'center' }, subtitle: { color: c.textSecondary, fontSize: 12, lineHeight: 18, marginBottom: spacing.sm }, deviceHero: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: c.card }, deviceIcon: { width: 50, height: 50, borderRadius: 17, backgroundColor: c.accentSoft, alignItems: 'center', justifyContent: 'center' }, fill: { flex: 1 }, eyebrow: { color: c.accent, fontFamily: 'Manrope_700Bold', fontSize: 8, letterSpacing: 1 }, deviceTitle: { color: c.text, fontFamily: 'Manrope_800ExtraBold', fontSize: 17, marginTop: 2 }, detail: { color: c.textSecondary, fontSize: 10, marginTop: 4 }, sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.md }, section: { color: c.text, fontFamily: 'Manrope_800ExtraBold', fontSize: 17 }, count: { color: c.textSecondary, fontSize: 11 }, vehicleCard: { gap: 13, marginTop: 2 }, vehicleTop: { flexDirection: 'row', alignItems: 'center', gap: 11 }, carIcon: { width: 46, height: 46, borderRadius: 15, backgroundColor: c.accentSoft, alignItems: 'center', justifyContent: 'center' }, vehicleTitle: { color: c.text, fontFamily: 'Manrope_700Bold', fontSize: 14 }, primaryPill: { backgroundColor: c.successSoft, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 5 }, primaryText: { color: c.success, fontFamily: 'Manrope_700Bold', fontSize: 8, letterSpacing: .7 }, vehicleActions: { flexDirection: 'row', gap: 8 }, secondaryButton: { flex: 1, minHeight: 38, borderRadius: 12, backgroundColor: c.surfaceMuted, alignItems: 'center', justifyContent: 'center' }, primarySpacer: { flex: 1 }, secondaryText: { color: c.text, fontFamily: 'Manrope_700Bold', fontSize: 11 }, iconButton: { width: 40, height: 38, borderRadius: 12, backgroundColor: c.surfaceMuted, alignItems: 'center', justifyContent: 'center' }, confirm: { flexDirection: 'row', alignItems: 'center', gap: 12, borderTopWidth: StyleSheet.hairlineWidth, borderColor: c.border, paddingTop: 12 }, confirmText: { color: c.textSecondary, fontSize: 10, flex: 1 }, cancel: { color: c.text, fontFamily: 'Manrope_700Bold', fontSize: 11 }, delete: { color: c.danger, fontFamily: 'Manrope_700Bold', fontSize: 11 }, ecosystem: { minHeight: 66, flexDirection: 'row', alignItems: 'center', gap: 11, marginTop: spacing.sm }, ecosystemIcon: { width: 42, height: 42, borderRadius: 14, backgroundColor: c.accentSoft, alignItems: 'center', justifyContent: 'center' }, empty: { alignItems: 'center', gap: 7, paddingVertical: 26 } });
