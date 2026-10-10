import { useState } from 'react';
import { Text, View, StyleSheet } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppHeader } from '../components/AppHeader';
import { ScreenShell } from '../components/ScreenShell';
import { MotionPressable } from '../components/MotionPressable';
import { useCruise } from '../features/devices/CruiseContext';
import { useVehicles } from '../features/vehicles/VehicleContext';
import type { RootStackParamList } from '../navigation/types';
import { useAppearance } from '../theme/AppearanceContext';
import type { AppColors } from '../theme/colors';
export function ConnectedDevicesScreen({ navigation }: NativeStackScreenProps<RootStackParamList, 'ConnectedDevices'>) {
  const { colors: c } = useAppearance();
  const s = makeThemeStyles(c);

  const cruise = useCruise(); const { vehicles } = useVehicles(); const [message, setMessage] = useState('');
  return <ScreenShell><AppHeader title="Devices" onBack={() => navigation.goBack()} />
    <View style={s.hero}><Text style={s.heroTitle}>CUBO Cruise</Text><Text style={s.heroBody}>Your dedicated safety camera.</Text></View>
    <Text style={s.body}>CUBO works with your phone on its own. Cruise is optional hardware that adds a dedicated camera and device diagnostics.</Text>
    <View style={s.card}><Text style={s.title}>{cruise.available ? 'Hardware transport available' : 'No hardware connection'}</Text><Text style={s.body}>{cruise.message}</Text><MotionPressable style={s.button} onPress={() => void cruise.scan()}><Text style={s.buttonText}>{cruise.available ? 'Find CUBO Cruise' : 'Check connection availability'}</Text></MotionPressable></View>
    {!cruise.bindings.length ? <View style={s.card}><View style={s.metrics}><View><Text style={s.value}>—</Text><Text style={s.body}>Battery</Text></View><View><Text style={s.value}>Not paired</Text><Text style={s.body}>Diagnostics</Text></View></View><Text style={s.body}>Pair a Cruise box to view battery level, firmware, camera health, and its camera preview.</Text></View> : null}
    {cruise.discovered.filter(id => !cruise.bindings.some(binding => binding.deviceId === id)).map(id => <View key={id} style={s.card}><Text style={s.title}>{id}</Text>{vehicles.map(vehicle => <MotionPressable key={vehicle.id} style={s.row} onPress={() => void cruise.pair(id, vehicle.id)}><Text style={s.link}>Pair with {vehicle.make} {vehicle.model}</Text></MotionPressable>)}</View>)}
    {cruise.bindings.map(binding => { const health = cruise.diagnostics[binding.deviceId]; const vehicle = vehicles.find(item => item.id === binding.vehicleId); return <View key={binding.deviceId} style={s.card}><Text style={s.title}>{vehicle ? vehicle.make + ' ' + vehicle.model : 'Paired Cruise'}</Text><Text style={s.body}>{binding.deviceId}</Text><View style={s.metrics}><View><Text style={s.value}>{health?.batteryPercent == null ? '—' : health.batteryPercent + '%'}</Text><Text style={s.body}>Battery{health?.charging ? ' · Charging' : ''}</Text></View><View><Text style={s.value}>{health?.cameraHealthy == null ? '—' : health.cameraHealthy ? 'Ready' : 'Check camera'}</Text><Text style={s.body}>Camera health</Text></View></View><Text style={s.body}>Firmware: {health?.firmware ?? 'Not received'}{health?.temperatureC != null ? ' · ' + health.temperatureC + '°C' : ''}</Text>{health ? <Text style={s.body}>Last checked: {new Date(health.checkedAt).toLocaleString()}</Text> : null}<MotionPressable style={s.row} onPress={() => { setMessage(''); void cruise.readDiagnostics(binding.deviceId).catch(error => setMessage(error.message)); }}><Text style={s.link}>Refresh diagnostics</Text></MotionPressable><MotionPressable style={s.button} onPress={() => navigation.navigate('CruiseCamera', { deviceId: binding.deviceId })}><Text style={s.buttonText}>Open hardware camera</Text></MotionPressable></View>; })}
    {message ? <Text style={s.body}>{message}</Text> : null}
    <Text style={s.body}>No simulated connections or battery readings. Pairing requires Cruise firmware and a native Bluetooth adapter; Expo Go cannot connect to the box.</Text>
  </ScreenShell>;
}
const makeThemeStyles = (c: AppColors) => StyleSheet.create({ hero: { padding: 24, borderRadius: 24, backgroundColor: '#183D2D', gap: 8 }, heroTitle: { fontSize: 28, color: '#FFFFFF', fontFamily: 'Manrope_800ExtraBold' }, heroBody: { color: '#D1E3D7', fontSize: 14 }, card: { padding: 20, gap: 12, borderRadius: 20, backgroundColor: c.card }, title: { color: c.text, fontSize: 17, fontFamily: 'Manrope_700Bold' }, body: { color: c.textSecondary, fontSize: 13, lineHeight: 20 }, button: { minHeight: 48, borderRadius: 14, backgroundColor: c.accent, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16 }, buttonText: { color: c.onAccent, fontSize: 13, fontFamily: 'Manrope_700Bold' }, row: { minHeight: 44, justifyContent: 'center' }, link: { color: c.accent, fontSize: 14 }, metrics: { flexDirection: 'row', justifyContent: 'space-between' }, value: { color: c.text, fontSize: 24, fontFamily: 'Manrope_700Bold' } });
