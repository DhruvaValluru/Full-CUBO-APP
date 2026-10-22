import { Ionicons } from '@expo/vector-icons';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AppHeader } from '../components/AppHeader';
import { ConfirmSheet } from '../components/ConfirmSheet';
import { MotionPressable } from '../components/MotionPressable';
import { Reveal } from '../components/Reveal';
import { ScreenShell } from '../components/ScreenShell';
import { VehicleArt } from '../components/VehicleArt';
import { VehicleColorSheet } from '../components/VehicleColorSheet';
import { useVehicles } from '../features/vehicles/VehicleContext';
import type { RootStackParamList } from '../navigation/types';
import { useAppearance } from '../theme/AppearanceContext';
import type { AppColors } from '../theme/colors';

export function GarageScreen() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const { vehicles, setPrimary, deleteVehicle, updateVehicle } = useVehicles();
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [colorVehicleId, setColorVehicleId] = useState<string | null>(null);
  const { colors } = useAppearance();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const selected = vehicles.find(vehicle => vehicle.primary) ?? vehicles[0];
  const colorVehicle = vehicles.find(vehicle => vehicle.id === colorVehicleId);

  return <ScreenShell>
    <AppHeader title="Garage" eyebrow="Select, personalize, and manage your vehicles." onBack={navigation.getState().type === 'tab' ? undefined : () => navigation.goBack()} />
    {selected ? <Reveal><View style={styles.stage}>
      <View style={styles.stageGlow} />
      <View style={styles.stageTop}><View style={styles.selectedPill}><View style={styles.liveDot} /><Text style={styles.selectedText}>SELECTED VEHICLE</Text></View><MotionPressable accessibilityLabel={`Change color for ${selected.make} ${selected.model}`} style={styles.paintButton} onPress={() => setColorVehicleId(selected.id)}><Ionicons name="color-palette-outline" size={19} color="#FFFFFF" /></MotionPressable></View>
      <View style={styles.heroVehicle}><VehicleArt make={selected.make} model={selected.model} paint={selected.paint} width={260} height={142} /></View>
      <View style={styles.stageFooter}><View style={styles.fill}><Text style={styles.heroTitle}>{selected.make} {selected.model}</Text><Text style={styles.heroMeta}>{selected.year || 'Year not set'} · {selected.plate || selected.nickname}</Text></View><MotionPressable accessibilityLabel={`View ${selected.make} ${selected.model}`} style={styles.openButton} onPress={() => navigation.navigate('VehicleDetail', { vehicleId: selected.id })}><Ionicons name="arrow-forward" size={20} color={colors.featureActionText} /></MotionPressable></View>
    </View></Reveal> : <View style={styles.emptyStage}><Ionicons name="car-sport-outline" size={38} color={colors.accent} /><Text style={styles.emptyTitle}>Make this garage yours</Text><Text style={styles.emptyBody}>Add a vehicle to unlock driving, calibration, and activity.</Text></View>}

    <View style={styles.sectionHeader}><View><Text style={styles.sectionTitle}>Your vehicles</Text><Text style={styles.sectionHint}>{vehicles.length} saved</Text></View><MotionPressable accessibilityLabel="Add vehicle" style={styles.addSmall} onPress={() => navigation.navigate('AddVehicle')}><Ionicons name="add" size={21} color={colors.onAccent} /></MotionPressable></View>
    <View style={styles.vehicleList}>{vehicles.map(vehicle => <View key={vehicle.id} style={[styles.vehicleRow, vehicle.primary && styles.vehicleRowSelected]}>
      <MotionPressable accessibilityLabel={`Change color for ${vehicle.make} ${vehicle.model}`} style={styles.thumbnail} onPress={() => setColorVehicleId(vehicle.id)}><VehicleArt make={vehicle.make} model={vehicle.model} paint={vehicle.paint} width={82} height={56} /></MotionPressable>
      <View style={styles.fill}><Text style={styles.vehicleTitle}>{vehicle.make} {vehicle.model}</Text><Text style={styles.detail}>{vehicle.year || 'Year not set'} · {vehicle.plate || vehicle.nickname}</Text>{vehicle.primary ? <Text style={styles.activeLabel}>ACTIVE FOR DRIVES</Text> : null}</View>
      {!vehicle.primary ? <MotionPressable accessibilityLabel={`Select ${vehicle.make} ${vehicle.model}`} style={styles.selectButton} onPress={() => setPrimary(vehicle.id)}><Text style={styles.selectText}>Select</Text></MotionPressable> : null}
      <MotionPressable accessibilityLabel={`View vehicle details for ${vehicle.make} ${vehicle.model}`} style={styles.rowAction} onPress={() => navigation.navigate('VehicleDetail', { vehicleId: vehicle.id })}><Ionicons name="chevron-forward" size={18} color={colors.textSecondary} /></MotionPressable>
      <MotionPressable accessibilityLabel={`Remove ${vehicle.make} ${vehicle.model}`} style={styles.deleteAction} onPress={() => setConfirmDelete(vehicle.id)}><Ionicons name="trash-outline" size={17} color={colors.danger} /></MotionPressable>
    </View>)}</View>
    <MotionPressable accessibilityLabel="Add another vehicle" style={styles.addVehicle} onPress={() => navigation.navigate('AddVehicle')}><View style={styles.addIcon}><Ionicons name="add" size={22} color={colors.accent} /></View><View style={styles.fill}><Text style={styles.addTitle}>Add another vehicle</Text><Text style={styles.detail}>Save its identity, color, and plate.</Text></View><Ionicons name="arrow-forward" size={18} color={colors.accent} /></MotionPressable>

    <ConfirmSheet visible={confirmDelete !== null} title="Remove this vehicle?" body="The vehicle will leave your garage. Existing trip history remains available." confirmLabel="Remove vehicle" onCancel={() => setConfirmDelete(null)} onConfirm={() => { if (confirmDelete) deleteVehicle(confirmDelete); setConfirmDelete(null); }} />
    {colorVehicle ? <VehicleColorSheet key={colorVehicle.id} vehicle={colorVehicle} onClose={() => setColorVehicleId(null)} onSave={paint => { const { id, primary, ...details } = colorVehicle; updateVehicle(id, { ...details, paint }); setColorVehicleId(null); }} /> : null}
  </ScreenShell>;
}

const makeStyles = (c: AppColors) => StyleSheet.create({
  fill: { flex: 1 },
  stage: { minHeight: 316, borderRadius: 30, padding: 20, overflow: 'hidden', backgroundColor: c.featureSurface, shadowColor: c.shadow, shadowOpacity: .18, shadowRadius: 24, shadowOffset: { width: 0, height: 12 }, elevation: 6 },
  stageGlow: { position: 'absolute', width: 290, height: 290, borderRadius: 145, right: -96, top: -110, backgroundColor: 'rgba(99,207,147,.16)' },
  stageTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  selectedPill: { minHeight: 30, borderRadius: 15, backgroundColor: 'rgba(255,255,255,.1)', paddingHorizontal: 11, flexDirection: 'row', alignItems: 'center', gap: 7 },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#70D6A2' },
  selectedText: { color: 'rgba(239,252,245,.78)', fontFamily: 'Manrope_800ExtraBold', fontSize: 8, letterSpacing: 1 },
  paintButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,.11)', alignItems: 'center', justifyContent: 'center' },
  heroVehicle: { minHeight: 176, alignItems: 'center', justifyContent: 'center' },
  stageFooter: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  heroTitle: { color: '#FFFFFF', fontFamily: 'Manrope_800ExtraBold', fontSize: 25, letterSpacing: -.7 },
  heroMeta: { color: 'rgba(232,249,240,.65)', fontSize: 11, marginTop: 4 },
  openButton: { width: 48, height: 48, borderRadius: 24, backgroundColor: c.featureAction, alignItems: 'center', justifyContent: 'center' },
  emptyStage: { minHeight: 240, borderRadius: 28, backgroundColor: c.accentSoft, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 36 },
  emptyTitle: { color: c.text, fontFamily: 'Manrope_800ExtraBold', fontSize: 18, marginTop: 12 },
  emptyBody: { color: c.textSecondary, fontSize: 11, lineHeight: 17, textAlign: 'center', marginTop: 5 },
  sectionHeader: { marginTop: 18, marginBottom: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { color: c.text, fontFamily: 'Manrope_800ExtraBold', fontSize: 20, letterSpacing: -.4 },
  sectionHint: { color: c.textSecondary, fontSize: 10, marginTop: 2 },
  addSmall: { width: 44, height: 44, borderRadius: 22, backgroundColor: c.accent, alignItems: 'center', justifyContent: 'center' },
  vehicleList: { borderRadius: 24, overflow: 'hidden', backgroundColor: c.card, borderWidth: StyleSheet.hairlineWidth, borderColor: c.border },
  vehicleRow: { minHeight: 92, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: c.border },
  vehicleRowSelected: { backgroundColor: c.accentSoft },
  thumbnail: { width: 76, height: 62, borderRadius: 16, backgroundColor: c.surfaceMuted, alignItems: 'center', justifyContent: 'center' },
  vehicleTitle: { color: c.text, fontFamily: 'Manrope_700Bold', fontSize: 14 },
  detail: { color: c.textSecondary, fontSize: 10, lineHeight: 15, marginTop: 3 },
  activeLabel: { color: c.accent, fontFamily: 'Manrope_800ExtraBold', fontSize: 7, letterSpacing: .8, marginTop: 5 },
  selectButton: { minHeight: 40, paddingHorizontal: 11, borderRadius: 13, backgroundColor: c.accentSoft, alignItems: 'center', justifyContent: 'center' },
  selectText: { color: c.accent, fontFamily: 'Manrope_700Bold', fontSize: 10 },
  rowAction: { width: 40, height: 44, alignItems: 'center', justifyContent: 'center' },
  deleteAction: { width: 40, height: 44, alignItems: 'center', justifyContent: 'center' },
  addVehicle: { minHeight: 78, borderRadius: 22, paddingHorizontal: 15, backgroundColor: c.card, borderWidth: 1, borderStyle: 'dashed', borderColor: c.borderStrong, flexDirection: 'row', alignItems: 'center', gap: 12 },
  addIcon: { width: 44, height: 44, borderRadius: 16, backgroundColor: c.accentSoft, alignItems: 'center', justifyContent: 'center' },
  addTitle: { color: c.text, fontFamily: 'Manrope_700Bold', fontSize: 14 },
});
