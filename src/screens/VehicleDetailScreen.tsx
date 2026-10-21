import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Text, View } from 'react-native';
import { AppHeader } from '../components/AppHeader';
import { VehicleArt } from '../components/VehicleArt';
import { ScreenShell } from '../components/ScreenShell';
import { MotionPressable } from '../components/MotionPressable';
import { TripRouteSnapshot } from '../components/TripRouteSnapshot';
import { useDrives } from '../features/drives/DriveContext';
import { formatDuration } from '../features/drives/formatDuration';
import { useVehicles } from '../features/vehicles/VehicleContext';
import type { RootStackParamList } from '../navigation/types';
import { useAppearance } from '../theme/AppearanceContext';

export function VehicleDetailScreen({ navigation, route }: NativeStackScreenProps<RootStackParamList, 'VehicleDetail'>) {
  const { colors: c } = useAppearance();
  const { vehicles, setPrimary } = useVehicles();
  const { sessions } = useDrives();
  const vehicle = vehicles.find(item => item.id === route.params.vehicleId);
  const body = { color: c.textSecondary, fontSize: 13, lineHeight: 20 };
  const heading = { color: c.text, fontSize: 19, fontFamily: 'Manrope_800ExtraBold' };
  if (!vehicle) return <ScreenShell><AppHeader title="Vehicle" onBack={() => navigation.goBack()} /><Text style={body}>This vehicle is no longer in your garage.</Text></ScreenShell>;
  const vehicleName = `${vehicle.make} ${vehicle.model}`;
  const trips = sessions.filter(item => item.vehicleName === vehicleName);
  const measured = trips.filter(item => item.attentionMeasured);
  const score = measured.length ? Math.round(measured.reduce((total, item) => total + item.focusScore, 0) / measured.length) : 100;
  const miles = trips.reduce((total, item) => total + item.distanceMiles, 0);
  const mapped = trips.find(item => item.route.length >= 2);
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
      <Text style={{ color: '#CBE0D4', fontSize: 11, letterSpacing: 1 }}>DRIVING SUMMARY</Text>
      <Text style={{ color: '#FFFFFF', fontSize: 28, fontFamily: 'Manrope_800ExtraBold' }}>{trips.length ? 'Your recorded drives.' : 'Ready for the first drive.'}</Text>
      <Text style={{ color: '#D1E3D7', fontSize: 13, lineHeight: 20 }}>{measured.length ? 'Safety score calculated from completed measured drives.' : 'New vehicles begin with a 100 starter score.'}</Text>
      <View style={{ flexDirection: 'row', gap: 20 }}>{[[String(trips.length), 'Trips'], [`${miles.toFixed(1)} mi`, 'Distance'], [String(score), measured.length ? 'Safety' : 'Starter']].map(([value, label]) => <View key={label} style={{ flex: 1, gap: 4 }}><Text style={{ color: '#FFFFFF', fontSize: 22, fontFamily: 'Manrope_800ExtraBold' }}>{value}</Text><Text style={{ color: '#D1E3D7', fontSize: 12 }}>{label}</Text></View>)}</View>
    </View>
    {mapped ? <><Text style={heading}>Latest Recorded Route</Text><TripRouteSnapshot points={mapped.route} hazards={mapped.events} accent={c.accent} background={c.mapSurface} /><Text style={body}>This map uses the route and safety events recorded for your account.</Text></> : null}
    <Text style={heading}>Recorded Trips</Text>
    {!trips.length ? <View style={{ minHeight: 120, borderRadius: 20, borderWidth: 1, borderStyle: 'dashed', borderColor: c.borderStrong, alignItems: 'center', justifyContent: 'center', padding: 20 }}><Ionicons name="navigate-outline" size={26} color={c.accent} /><Text style={[body, { textAlign: 'center', marginTop: 8 }]}>Completed drives with this vehicle will appear here.</Text></View> : trips.slice(0, 5).map((trip, index) => <MotionPressable key={trip.id} onPress={() => navigation.navigate('TripDetail', { sessionId: trip.id })} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 18, borderRadius: 18, backgroundColor: c.card }}><Ionicons name="navigate-outline" size={22} color={c.accent} /><View style={{ flex: 1 }}><Text style={{ color: c.text, fontFamily: 'Manrope_700Bold' }}>Drive {trips.length - index}</Text><Text style={body}>{new Date(trip.startedAt).toLocaleDateString()} · {formatDuration(trip.durationSeconds)} · {trip.distanceMiles.toFixed(1)} mi</Text></View><Text style={{ color: c.accent, fontFamily: 'Manrope_800ExtraBold', fontSize: 22 }}>{trip.attentionMeasured ? trip.focusScore : 100}</Text></MotionPressable>)}
  </ScreenShell>;
}
