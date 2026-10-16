import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Text, View } from 'react-native';
import { AppHeader } from '../components/AppHeader';
import { VehicleArt } from '../components/VehicleArt';
import { ScreenShell } from '../components/ScreenShell';
import { MotionPressable } from '../components/MotionPressable';
import { TripRouteSnapshot } from '../components/TripRouteSnapshot';
import { demoRoute, demoSafetyEvents } from '../features/family/demoRoute';
import { useVehicles } from '../features/vehicles/VehicleContext';
import type { RootStackParamList } from '../navigation/types';
import { useAppearance } from '../theme/AppearanceContext';

export function VehicleDetailScreen({ navigation, route }: NativeStackScreenProps<RootStackParamList, 'VehicleDetail'>) {
  const { colors: c } = useAppearance();
  const { vehicles, setPrimary } = useVehicles();
  const vehicle = vehicles.find(item => item.id === route.params.vehicleId);
  const body = { color: c.textSecondary, fontSize: 13, lineHeight: 20 };
  const heading = { color: c.text, fontSize: 19, fontFamily: 'Manrope_800ExtraBold' };
  if (!vehicle) return <ScreenShell><AppHeader title="Vehicle" onBack={() => navigation.goBack()} /><Text style={body}>This vehicle is no longer in your garage.</Text></ScreenShell>;
  return <ScreenShell>
    <AppHeader title={vehicle.make + ' ' + vehicle.model} onBack={() => navigation.goBack()} />
    <View style={{ alignItems: 'center', paddingVertical: 16, gap: 8 }}>
      <VehicleArt make={vehicle.make} model={vehicle.model} paint={vehicle.paint} width={260} height={170} />
      <Text style={heading}>{vehicle.nickname || vehicle.make + ' ' + vehicle.model}</Text>
      <Text style={body}>{[vehicle.year, vehicle.plate].filter(Boolean).join(' · ') || 'Your saved vehicle'}</Text>
    </View>
    <View style={{ flexDirection: 'row', gap: 12 }}>
      <MotionPressable disabled={vehicle.primary} onPress={() => setPrimary(vehicle.id)} style={{ flex: 1, minHeight: 52, borderRadius: 16, backgroundColor: vehicle.primary ? c.accentSoft : c.accent, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: vehicle.primary ? c.accent : c.onAccent, fontFamily: 'Manrope_700Bold' }}>{vehicle.primary ? '✓ Selected' : 'Select vehicle'}</Text></MotionPressable>
      <MotionPressable onPress={() => navigation.navigate('AddVehicle', { vehicleId: vehicle.id })} style={{ flex: 1, minHeight: 52, borderRadius: 16, backgroundColor: c.card, borderWidth: 1, borderColor: c.borderStrong, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: c.text, fontFamily: 'Manrope_700Bold' }}>Edit vehicle</Text></MotionPressable>
    </View>
    <View style={{ backgroundColor: '#183D2D', borderRadius: 24, padding: 24, gap: 10 }}>
      <Text style={{ color: '#CBE0D4', fontSize: 11, letterSpacing: 1 }}>DEMO DRIVING SUMMARY</Text>
      <Text style={{ color: '#FFFFFF', fontSize: 28, fontFamily: 'Manrope_800ExtraBold' }}>Everyday miles.</Text>
      <Text style={{ color: '#D1E3D7', fontSize: 13, lineHeight: 20 }}>Sample history for this vehicle—not your recorded trips.</Text>
      <View style={{ flexDirection: 'row', gap: 20 }}>{[['12', 'Trips'], ['86 mi', 'Distance'], ['94', 'Safety']].map(([value, label]) => <View key={label} style={{ flex: 1, gap: 4 }}><Text style={{ color: '#FFFFFF', fontSize: 22, fontFamily: 'Manrope_800ExtraBold' }}>{value}</Text><Text style={{ color: '#D1E3D7', fontSize: 12 }}>{label}</Text></View>)}</View>
    </View>
    <Text style={heading}>Where this vehicle went</Text>
    <Text style={body}>Downtown Raleigh · Fictional sample route</Text>
    <TripRouteSnapshot points={demoRoute} hazards={demoSafetyEvents} accent={c.accent} background={c.mapSurface} />
    <Text style={body}>Two sample attention events are marked on the map. No device location was used.</Text>
    <Text style={heading}>Sample trips</Text>
    {[['Afternoon drive', '18 min · 5.2 mi', '94'], ['Morning drive', '24 min · 7.1 mi', '96']].map(([title, detail, score]) => <View key={title} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 18, borderRadius: 18, backgroundColor: c.card }}><Ionicons name="navigate-outline" size={22} color={c.accent} /><View style={{ flex: 1 }}><Text style={{ color: c.text, fontFamily: 'Manrope_700Bold' }}>{title}</Text><Text style={body}>{detail} · Demo</Text></View><Text style={{ color: c.accent, fontFamily: 'Manrope_800ExtraBold', fontSize: 22 }}>{score}</Text></View>)}
  </ScreenShell>;
}
