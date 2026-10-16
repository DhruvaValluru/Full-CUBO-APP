import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { VehicleArt, vehicleAppearance, vehiclePaints } from './VehicleArt';
import type { SavedVehicle } from '../features/vehicles/VehicleContext';
import { useAppearance } from '../theme/AppearanceContext';

export function VehicleColorSheet({ vehicle, onClose, onSave }: {
  vehicle: SavedVehicle;
  onClose: () => void;
  onSave: (paint: string) => void;
}) {
  const { colors: c } = useAppearance();
  const [paint, setPaint] = useState(vehicleAppearance(vehicle.make, vehicle.model, vehicle.paint).id);
  return <Modal transparent visible onRequestClose={onClose}>
    <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: '#00000066' }}>
      <Pressable accessibilityRole="button" accessibilityLabel="Cancel color change" onPress={onClose} style={{ position: 'absolute', inset: 0 }} />
      <SafeAreaView edges={['bottom']} accessibilityViewIsModal style={{ maxHeight: '90%', backgroundColor: c.card, borderTopLeftRadius: 24, borderTopRightRadius: 24 }}>
        <ScrollView contentContainerStyle={{ padding: 24, gap: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text accessibilityRole="header" style={{ color: c.text, fontSize: 20, fontFamily: 'Manrope_800ExtraBold' }}>Vehicle color</Text>
            <Pressable accessibilityRole="button" accessibilityLabel="Cancel color change" onPress={onClose} style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: c.surfaceMuted, alignItems: 'center', justifyContent: 'center' }}><Ionicons name="close" size={22} color={c.text} /></Pressable>
          </View>
          <View style={{ alignItems: 'center' }}><VehicleArt make={vehicle.make} model={vehicle.model} paint={paint} width={260} height={160} /><Text style={{ color: c.textSecondary }}>{vehicle.make} {vehicle.model}</Text></View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
            {vehiclePaints.map(option => <Pressable key={option.id} accessibilityRole="button" accessibilityLabel={option.name} accessibilityState={{ selected: paint === option.id }} onPress={() => setPaint(option.id)} style={{ width: '46%', minHeight: 80, borderRadius: 16, borderWidth: 2, borderColor: paint === option.id ? c.accent : c.border, backgroundColor: paint === option.id ? c.accentSoft : c.card, alignItems: 'center', justifyContent: 'center', gap: 8, padding: 12 }}>
              <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: option.hex, borderWidth: 1, borderColor: c.border, alignItems: 'center', justifyContent: 'center' }}>{paint === option.id && <Ionicons name="checkmark" size={20} color={option.id === 'white' ? '#166B50' : '#FFFFFF'} />}</View>
              <Text style={{ color: c.text, fontSize: 12, fontFamily: 'Manrope_700Bold' }}>{option.name}</Text>
            </Pressable>)}
          </View>
          <Pressable accessibilityRole="button" onPress={() => onSave(paint)} style={{ minHeight: 52, borderRadius: 16, backgroundColor: c.accent, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: c.onAccent, fontFamily: 'Manrope_700Bold' }}>Save color</Text></Pressable>
        </ScrollView>
      </SafeAreaView>
    </View>
  </Modal>;
}
