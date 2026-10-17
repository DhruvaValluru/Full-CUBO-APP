import { Ionicons } from '@expo/vector-icons';
import { Pressable, ScrollView, Text, View } from 'react-native';
import type { PlaceResult } from '../features/places/searchPlaces';
import { latestPlaces } from '../features/places/recentPlaces';
import { useAppearance } from '../theme/AppearanceContext';

export function RecentDestinations({ places, onSelect }: { places: PlaceResult[]; onSelect: (place: PlaceResult) => void }) {
  const { colors: c } = useAppearance();
  const recent = latestPlaces(places);
  if (!recent.length) return null;
  return <View style={{ paddingTop: 8 }}><Text style={{ color: c.textSecondary, fontFamily: 'Manrope_700Bold', fontSize: 12, padding: 12 }}>Recent destinations</Text><ScrollView keyboardShouldPersistTaps="always" nestedScrollEnabled style={{ maxHeight: 228 }}>{recent.map((place, index) => <Pressable key={place.id} accessibilityLabel={`Use recent destination ${place.title}, ${place.subtitle}`} onPress={() => onSelect(place)} style={{ minHeight: 60, padding: 12, gap: 12, flexDirection: 'row', alignItems: 'center', backgroundColor: c.card, borderTopWidth: index ? 1 : 0, borderColor: c.border }}><Ionicons name="time-outline" size={19} color={c.accent} /><View style={{ flex: 1 }}><Text numberOfLines={1} style={{ color: c.text, fontFamily: 'Manrope_700Bold', fontSize: 13 }}>{place.title}</Text><Text numberOfLines={1} style={{ color: c.textSecondary, fontSize: 11, marginTop: 4 }}>{place.subtitle}</Text></View><Ionicons name="arrow-forward" size={17} color={c.textSecondary} /></Pressable>)}</ScrollView></View>;
}
