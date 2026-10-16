import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Pressable, Text, View } from 'react-native';
import type { ImageSourcePropType } from 'react-native';
import { useAppearance } from '../theme/AppearanceContext';

export const vehiclePaints = [
  { id: 'white', name: 'Pearl white', hex: '#F0F1EE', image: require('../../assets/vehicles/compact-car.png') },
  { id: 'graphite', name: 'Graphite', hex: '#43474C', image: require('../../assets/vehicles/compact-car-graphite.png') },
  { id: 'green', name: 'Forest green', hex: '#245C49', image: require('../../assets/vehicles/compact-car-green.png') },
  { id: 'navy', name: 'Midnight blue', hex: '#334866', image: require('../../assets/vehicles/compact-car-navy.png') },
  { id: 'burgundy', name: 'Burgundy', hex: '#833D45', image: require('../../assets/vehicles/compact-car-burgundy.png') },
] as const;
export type VehiclePaint = typeof vehiclePaints[number]['id'];
export function vehicleAppearance(_make: string, _model: string, paint?: string) {
  return vehiclePaints.find(item => item.id === paint) ?? vehiclePaints[0];
}
/** Same representative 3D hatchback across paint variants; not an exact manufacturer model. */
export function VehicleArt({ make, model, paint, width = 100, height = 78 }: { make: string; model: string; paint?: string; width?: number; height?: number }) {
  const chosen = vehicleAppearance(make, model, paint);
  const { colors } = useAppearance();
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => { setLoaded(false); setFailed(false); setAttempt(0); }, [chosen.id]);
  // Keep the image mounted when appearance changes: remounting discards the
  // in-flight native asset load, which can prolong empty circles on slow LANs.
  return <View style={{ width, height, flexShrink: 0, alignItems: 'center', justifyContent: 'center' }}>
    <Image key={`${chosen.id}:${attempt}`} source={chosen.image as ImageSourcePropType} resizeMode="contain" fadeDuration={0} style={{ width, height, flexShrink: 0 }} onLoad={() => { setLoaded(true); setFailed(false); }} onError={() => { setFailed(true); setLoaded(false); }} accessibilityLabel={chosen.name + ' vehicle'} />
    {!loaded ? <View style={{ position: 'absolute', inset: 0, alignItems: 'center', justifyContent: 'center' }}>{failed ? <Pressable accessibilityRole="button" accessibilityLabel="Retry loading vehicle image" hitSlop={12} onPress={() => { setFailed(false); setAttempt(value => value + 1); }}><Text style={{ color: colors.accent, fontSize: 11 }}>Retry image</Text></Pressable> : <ActivityIndicator accessibilityLabel="Loading vehicle image" size="small" color={colors.accent} />}</View> : null}
  </View>;
}
