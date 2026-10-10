import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ScreenShell } from '../components/ScreenShell';
import { useDrives } from '../features/drives/DriveContext';
import type { RootStackParamList } from '../navigation/types';
import { useAppearance } from '../theme/AppearanceContext';
import type { AppColors } from '../theme/colors';

export function DriveEventsScreen({ navigation, route }: NativeStackScreenProps<RootStackParamList, 'DriveEvents'>) {
  const { colors: c } = useAppearance();
  const s = makeThemeStyles(c);

  const { sessions } = useDrives();
  const events = sessions.find((session) => session.id === route.params.sessionId)?.events ?? [];
  return <ScreenShell><View style={s.header}><Pressable accessibilityLabel="Back to trip summary" style={s.back} onPress={() => navigation.goBack()}><Ionicons name="chevron-back" size={22} color={c.text} /></Pressable><Text style={s.title}>Drive events</Text></View>{events.length ? events.map((event) => <View key={event.id} style={s.event}><View style={s.icon}><Ionicons name={event.type === 'road_hazard' ? 'location-outline' : event.type === 'phone_detected' ? 'phone-portrait-outline' : 'eye-outline'} size={20} color={c.accent} /></View><View style={s.copy}><View style={s.row}><Text style={s.eventTitle}>{event.title}</Text><Text style={s.time}>{Math.floor(event.elapsedSeconds / 60)}:{String(event.elapsedSeconds % 60).padStart(2, '0')}</Text></View><Text style={s.detail}>{event.detail}</Text>{event.latitude != null && event.longitude != null ? <Text style={s.location}>{event.latitude.toFixed(4)}, {event.longitude.toFixed(4)}</Text> : null}</View></View>) : <View style={s.empty}><Ionicons name="checkmark-circle-outline" size={28} color={c.accent} /><Text style={s.eventTitle}>No events recorded</Text><Text style={s.detail}>Road reports and detected attention events appear here.</Text></View>}</ScreenShell>;
}
const makeThemeStyles = (c: AppColors) => StyleSheet.create({ header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 12 }, back: { width: 44, height: 44, borderRadius: 14, backgroundColor: c.card, alignItems: 'center', justifyContent: 'center' }, title: { color: c.text, fontFamily: 'Manrope_800ExtraBold', fontSize: 23 }, event: { flexDirection: 'row', gap: 12, padding: 16, borderRadius: 20, backgroundColor: c.card }, icon: { width: 40, height: 40, borderRadius: 14, backgroundColor: c.accentSoft, alignItems: 'center', justifyContent: 'center' }, copy: { flex: 1 }, row: { flexDirection: 'row', gap: 10, justifyContent: 'space-between' }, eventTitle: { flexShrink: 1, color: c.text, fontFamily: 'Manrope_700Bold', fontSize: 13 }, time: { color: c.textSecondary, fontSize: 10 }, detail: { color: c.textSecondary, fontSize: 11, lineHeight: 17, marginTop: 5 }, location: { color: c.textTertiary, fontSize: 9, marginTop: 6 }, empty: { alignItems: 'center', gap: 10, padding: 28, borderRadius: 20, backgroundColor: c.card } });
