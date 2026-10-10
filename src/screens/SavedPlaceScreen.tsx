import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TextInput, View } from 'react-native';
import { ScreenShell } from '../components/ScreenShell';
import { MotionPressable } from '../components/MotionPressable';
import { usePlaces } from '../features/places/PlacesContext';
import { searchPlaces, type PlaceResult } from '../features/places/searchPlaces';
import { useDriveLocation } from '../hooks/useDriveLocation';
import { RootStackParamList } from '../navigation/types';
import { useAppearance } from '../theme/AppearanceContext';
import type { AppColors } from '../theme/colors';
export function SavedPlaceScreen({ navigation, route }: NativeStackScreenProps<RootStackParamList, 'SavedPlace'>) {
  const { colors: c } = useAppearance();
  const s = makeThemeStyles(c);

  const { save } = usePlaces(); const gps = useDriveLocation(true);
  const [query, setQuery] = useState(''); const [places, setPlaces] = useState<PlaceResult[]>([]);
  const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  useEffect(() => { const controller = new AbortController(); setPlaces([]); if (query.trim().length < 2) return; const timer = setTimeout(async () => { setBusy(true); setError(''); try { const result = await searchPlaces(query, gps.point, controller.signal); if (!controller.signal.aborted) setPlaces(result); } catch { if (!controller.signal.aborted) setError('Search unavailable. Try again.'); } finally { if (!controller.signal.aborted) setBusy(false); } }, 250); return () => { clearTimeout(timer); controller.abort(); }; }, [query, gps.point?.latitude, gps.point?.longitude]);
  return <ScreenShell><MotionPressable onPress={() => navigation.goBack()} style={s.back}><Ionicons name="chevron-back" size={20} color={c.text} /><Text style={s.label}>Back</Text></MotionPressable><Text style={s.title}>Set {route.params.kind} address</Text><TextInput autoFocus value={query} onChangeText={setQuery} placeholder="Search an address or place" placeholderTextColor={c.textSecondary} style={s.input} />{busy ? <ActivityIndicator color={c.accent} /> : null}{error ? <Text>{error}</Text> : null}{places.map(place => <MotionPressable key={place.id} style={s.row} onPress={() => { save(route.params.kind, place); navigation.goBack(); }}><Ionicons name="location-outline" color={c.accent} size={22} /><View style={{ flex: 1 }}><Text style={s.label}>{place.title}</Text><Text style={s.address}>{place.subtitle}</Text></View><Ionicons name="add" size={20} color={c.accent} /></MotionPressable>)}</ScreenShell>;
}
const makeThemeStyles = (c: AppColors) => StyleSheet.create({ back: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 44 }, title: { fontSize: 26, fontFamily: 'Manrope_800ExtraBold', color: c.text, marginVertical: 16 }, input: { backgroundColor: c.card, borderRadius: 18, padding: 16, minHeight: 54, color: c.text }, row: { backgroundColor: c.card, padding: 16, borderRadius: 18, flexDirection: 'row', alignItems: 'center', gap: 12 }, label: { color: c.text, fontFamily: 'Manrope_700Bold', fontSize: 14 }, address: { color: c.textSecondary, fontSize: 12, lineHeight: 18, marginTop: 4 } });
