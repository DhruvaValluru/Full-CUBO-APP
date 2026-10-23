import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useIsFocused } from '@react-navigation/native';
import { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TextInput, View } from 'react-native';
import { ScreenShell } from '../components/ScreenShell';
import { MotionPressable } from '../components/MotionPressable';
import { usePlaces } from '../features/places/PlacesContext';
import { usePlaceSuggestions } from '../features/places/usePlaceSuggestions';
import { useDriveLocation } from '../hooks/useDriveLocation';
import { RootStackParamList } from '../navigation/types';
import { useAppearance } from '../theme/AppearanceContext';
import type { AppColors } from '../theme/colors';
export function SavedPlaceScreen({ navigation, route }: NativeStackScreenProps<RootStackParamList, 'SavedPlace'>) {
  const { colors: c } = useAppearance();
  const s = makeThemeStyles(c);

  const { save } = usePlaces(); const focused = useIsFocused(); const gps = useDriveLocation(focused);
  const [query, setQuery] = useState('');
  const { results: places, busy, error } = usePlaceSuggestions(query, gps.point, focused);
  return <ScreenShell><MotionPressable onPress={() => navigation.goBack()} style={s.back}><Ionicons name="chevron-back" size={20} color={c.text} /><Text style={s.label}>Back</Text></MotionPressable><Text style={s.title}>Set {route.params.kind} address</Text><TextInput accessibilityLabel={`Set ${route.params.kind} address`} autoFocus autoCorrect={false} autoCapitalize="words" value={query} onChangeText={setQuery} placeholder="Street address, place, or city" placeholderTextColor={c.textSecondary} style={s.input} />{busy ? <ActivityIndicator color={c.accent} /> : null}{error ? <Text accessibilityRole="alert" style={{ color: c.danger }}>{error}</Text> : null}{places.map(place => <MotionPressable key={place.id} style={s.row} onPress={() => { save(route.params.kind, place); navigation.goBack(); }}><Ionicons name="location-outline" color={c.accent} size={22} /><View style={{ flex: 1 }}><Text style={s.label}>{place.title}</Text><Text style={s.address}>{place.subtitle}</Text></View><Ionicons name="add" size={20} color={c.accent} /></MotionPressable>)}</ScreenShell>;
}
const makeThemeStyles = (c: AppColors) => StyleSheet.create({ back: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 44 }, title: { fontSize: 26, fontFamily: 'Manrope_800ExtraBold', color: c.text, marginVertical: 16 }, input: { backgroundColor: c.card, borderRadius: 18, padding: 16, minHeight: 54, color: c.text }, row: { backgroundColor: c.card, padding: 16, borderRadius: 18, flexDirection: 'row', alignItems: 'center', gap: 12 }, label: { color: c.text, fontFamily: 'Manrope_700Bold', fontSize: 14 }, address: { color: c.textSecondary, fontSize: 12, lineHeight: 18, marginTop: 4 } });
