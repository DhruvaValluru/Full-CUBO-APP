import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AppHeader } from '../components/AppHeader';
import { ScreenShell } from '../components/ScreenShell';
import { SurfaceCard } from '../components/SurfaceCard';
import { DeviceKind, DeviceStatus, useDevices } from '../features/devices/DeviceContext';
import type { RootStackParamList } from '../navigation/types';
import { useAppearance } from '../theme/AppearanceContext';
import type { AppColors } from '../theme/colors';
import { spacing } from '../theme/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'ConnectedDevices'>;
const icons: Record<DeviceKind, keyof typeof Ionicons.glyphMap> = { cubo: 'hardware-chip-outline', obd: 'speedometer-outline', watch: 'watch-outline', speaker: 'volume-high-outline', carplay: 'car-sport-outline' };
const labels: Record<DeviceStatus, string> = { connected: 'Connected', available: 'Connect demo', 'coming-soon': 'Entitlement needed', 'requires-native': 'Native build' };

export function ConnectedDevicesScreen({ navigation }: Props) {
  const { colors } = useAppearance(); const styles = useMemo(() => makeStyles(colors), [colors]);
  const { devices, toggleConnection, scan, scanState } = useDevices();
  return <ScreenShell><AppHeader title="Connected ecosystem" eyebrow="Devices" onBack={() => navigation.goBack()} action={<Pressable style={[styles.scan, { backgroundColor: colors.accentSoft }]} onPress={scan}><Ionicons name={scanState === 'scanning' ? 'sync' : 'scan-outline'} size={17} color={colors.accent} /><Text style={[styles.scanText, { color: colors.accent }]}>{scanState === 'scanning' ? 'Scanning' : scanState === 'complete' ? 'Scan again' : 'Scan'}</Text></Pressable>} />
    <Text style={styles.intro}>One place for the signals and surfaces CUBO can use now—or support through native integrations later.</Text>
    {devices.map((device) => <SurfaceCard key={device.id} style={styles.card}><View style={styles.cardTop}><View style={styles.icon}><Ionicons name={icons[device.id]} size={22} color={colors.accent} /></View><View style={styles.fill}><Text style={styles.name}>{device.name}</Text><Text style={styles.transport}>{device.transport}</Text></View><View style={[styles.dot, { backgroundColor: device.status === 'connected' ? colors.success : device.status === 'available' ? colors.amber : colors.textTertiary }]} /></View><Text style={styles.detail}>{device.detail}</Text><View style={styles.chips}>{device.capabilities.map((capability) => <View key={capability} style={styles.chip}><Text style={styles.chipText}>{capability.replace('-', ' ')}</Text></View>)}</View><Pressable disabled={device.status === 'coming-soon' || device.status === 'requires-native'} style={[styles.action, { backgroundColor: device.status === 'connected' ? colors.surfaceMuted : colors.accent }, (device.status === 'coming-soon' || device.status === 'requires-native') && styles.disabled]} onPress={() => toggleConnection(device.id)}><Text style={[styles.actionText, { color: device.status === 'connected' ? colors.text : colors.onAccent }]}>{device.status === 'connected' ? 'Disconnect demo' : labels[device.status]}</Text></Pressable></SurfaceCard>)}
    <Text style={styles.footnote}>Framework status is honest by design: web demo connections are persisted locally; real BLE, WatchConnectivity, and CarPlay require native modules, device testing, permissions, and—for CarPlay—Apple approval.</Text>
  </ScreenShell>;
}

const makeStyles = (c: AppColors) => StyleSheet.create({ scan: { paddingHorizontal: 11, height: 36, borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 6 }, scanText: { fontFamily: 'Manrope_700Bold', fontSize: 11 }, intro: { color: c.textSecondary, fontSize: 12, lineHeight: 19, marginBottom: spacing.sm }, card: { gap: 11, marginTop: 4 }, cardTop: { flexDirection: 'row', alignItems: 'center', gap: 11 }, icon: { width: 43, height: 43, borderRadius: 14, backgroundColor: c.accentSoft, alignItems: 'center', justifyContent: 'center' }, fill: { flex: 1 }, name: { color: c.text, fontFamily: 'Manrope_700Bold', fontSize: 15 }, transport: { color: c.textTertiary, fontSize: 10, marginTop: 2 }, dot: { width: 8, height: 8, borderRadius: 4 }, detail: { color: c.textSecondary, fontSize: 11, lineHeight: 17 }, chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 }, chip: { borderRadius: 999, paddingHorizontal: 9, paddingVertical: 5, backgroundColor: c.surfaceMuted }, chipText: { color: c.textSecondary, fontSize: 9, textTransform: 'capitalize' }, action: { minHeight: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center' }, actionText: { fontFamily: 'Manrope_700Bold', fontSize: 12 }, disabled: { opacity: .52 }, footnote: { color: c.textTertiary, fontSize: 10, lineHeight: 16, paddingVertical: spacing.md } });
