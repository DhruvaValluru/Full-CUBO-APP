import { Text, View } from 'react-native';
import { useAppearance } from '../theme/AppearanceContext';

export function SharedLocationMap({ latitude, longitude, name }: { latitude: number; longitude: number; name: string }) {
  const { colors } = useAppearance();
  return <View style={{ minHeight: 190, borderRadius: 20, backgroundColor: colors.mapSurface, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
    <Text style={{ color: colors.text, fontFamily: 'Manrope_700Bold' }}>{name}'s shared location</Text>
    <Text style={{ color: colors.textSecondary, marginTop: 6 }}>{latitude.toFixed(5)}, {longitude.toFixed(5)}</Text>
  </View>;
}

