import { useEffect, useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppHeader } from '../components/AppHeader';
import { ScreenShell } from '../components/ScreenShell';
import { useCruise } from '../features/devices/CruiseContext';
import type { RootStackParamList } from '../navigation/types';
import { useAppearance } from '../theme/AppearanceContext';
import type { AppColors } from '../theme/colors';
export function CruiseCameraScreen({ navigation, route }: NativeStackScreenProps<RootStackParamList, 'CruiseCamera'>) {
  const { colors: c } = useAppearance();
  const s = makeThemeStyles(c);

  const cruise = useCruise(); const [uri, setUri] = useState<string | null>(null); const [error, setError] = useState('Connecting to the Cruise camera…');
  useEffect(() => { let active = true; let timer: ReturnType<typeof setTimeout>; const next = async () => { try { const frame = await cruise.readCameraFrame(route.params.deviceId); if (!active) return; setUri(frame); setError(''); timer = setTimeout(next, 1000); } catch (cause) { if (active) setError(cause instanceof Error ? cause.message : 'Camera disconnected.'); } }; void next(); return () => { active = false; clearTimeout(timer); }; }, [route.params.deviceId]);
  return <ScreenShell><AppHeader title="Cruise camera" onBack={() => navigation.goBack()} /><View style={s.camera}>{uri ? <Image source={{ uri }} resizeMode="contain" style={s.image} /> : <Text style={s.text}>No camera frames received</Text>}</View><Text style={s.note}>{error || 'Connected hardware preview · refreshes once per second'}</Text><Text style={s.note}>This is the Cruise hardware camera, not your phone camera. No footage is shared with family.</Text></ScreenShell>;
}
const makeThemeStyles = (c: AppColors) => StyleSheet.create({ camera: { height: 350, borderRadius: 24, backgroundColor: '#14221B', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }, image: { width: '100%', height: '100%' }, text: { color: '#FFFFFF' }, note: { color: c.textSecondary, fontSize: 13, lineHeight: 20 } });
