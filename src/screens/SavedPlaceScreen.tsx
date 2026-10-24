import { Ionicons } from '@expo/vector-icons';
import { useIsFocused } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TextInput, View } from 'react-native';

import { AppHeader } from '../components/AppHeader';
import { MotionPressable } from '../components/MotionPressable';
import { ScreenShell } from '../components/ScreenShell';
import { usePlaces } from '../features/places/PlacesContext';
import { usePlaceSuggestions } from '../features/places/usePlaceSuggestions';
import { useDriveLocation } from '../hooks/useDriveLocation';
import { RootStackParamList } from '../navigation/types';
import { useAppearance } from '../theme/AppearanceContext';
import type { AppColors } from '../theme/colors';

export function SavedPlaceScreen({ navigation, route }: NativeStackScreenProps<RootStackParamList, 'SavedPlace'>) {
  const { colors } = useAppearance();
  const styles = makeStyles(colors);
  const { save } = usePlaces();
  const focused = useIsFocused();
  const gps = useDriveLocation(focused);
  const [query, setQuery] = useState('');
  const { results: places, busy, error } = usePlaceSuggestions(query, gps.point, focused);
  const label = route.params.kind === 'home' ? 'Home' : 'Work';

  return <ScreenShell>
    <AppHeader title={`${label} address`} eyebrow="Saved places" onBack={() => navigation.goBack()} />
    <View style={styles.searchShell}>
      <Ionicons name="search" size={20} color={colors.textSecondary} />
      <TextInput accessibilityLabel={`Set ${route.params.kind} address`} autoFocus autoCorrect={false} autoCapitalize="words" value={query} onChangeText={setQuery} placeholder="Street address, place, or city" placeholderTextColor={colors.textTertiary} style={styles.input} />
      {busy ? <ActivityIndicator size="small" color={colors.accent} /> : null}
    </View>
    <Text style={styles.hint}>Search tolerates common misspellings. Choose the exact result below before saving.</Text>
    {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
    {places.length ? <View style={styles.results}>{places.map((place, index) => <MotionPressable key={place.id} style={[styles.row, index > 0 && styles.rowBorder]} onPress={() => { save(route.params.kind, place); navigation.goBack(); }}>
      <View style={styles.resultIcon}><Ionicons name="location-outline" color={colors.accent} size={20} /></View>
      <View style={styles.fill}><Text style={styles.label}>{place.title}</Text><Text style={styles.address}>{place.subtitle}</Text></View>
      <Ionicons name="arrow-forward" size={18} color={colors.textTertiary} />
    </MotionPressable>)}</View> : query.trim() && !busy ? <View style={styles.empty}><Ionicons name="map-outline" size={26} color={colors.accent} /><Text style={styles.emptyTitle}>Keep typing</Text><Text style={styles.hint}>Try a house number, street, city, or recognizable place name.</Text></View> : null}
  </ScreenShell>;
}

const makeStyles = (c: AppColors) => StyleSheet.create({
  fill: { flex: 1 },
  searchShell: { minHeight: 62, borderRadius: 20, paddingHorizontal: 16, backgroundColor: c.card, borderWidth: 1, borderColor: c.borderStrong, flexDirection: 'row', alignItems: 'center', gap: 10, shadowColor: c.shadow, shadowOpacity: .06, shadowRadius: 14, shadowOffset: { width: 0, height: 7 } },
  input: { flex: 1, minWidth: 0, minHeight: 58, color: c.text, fontFamily: 'Manrope_600SemiBold', fontSize: 16 },
  hint: { color: c.textSecondary, fontSize: 10, lineHeight: 16, marginHorizontal: 4 },
  error: { color: c.danger, fontSize: 11, lineHeight: 16 },
  results: { marginTop: 8, borderRadius: 24, overflow: 'hidden', backgroundColor: c.card, borderWidth: StyleSheet.hairlineWidth, borderColor: c.border },
  row: { minHeight: 76, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 12 },
  rowBorder: { borderTopWidth: StyleSheet.hairlineWidth, borderColor: c.border },
  resultIcon: { width: 42, height: 42, borderRadius: 15, backgroundColor: c.accentSoft, alignItems: 'center', justifyContent: 'center' },
  label: { color: c.text, fontFamily: 'Manrope_700Bold', fontSize: 14 },
  address: { color: c.textSecondary, fontSize: 11, lineHeight: 16, marginTop: 3 },
  empty: { minHeight: 180, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  emptyTitle: { color: c.text, fontFamily: 'Manrope_800ExtraBold', fontSize: 16, marginTop: 10 },
});
