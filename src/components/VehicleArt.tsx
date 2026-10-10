import { Image } from 'react-native';
import type { ImageSourcePropType } from 'react-native';

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
  return <Image source={chosen.image as ImageSourcePropType} resizeMode="contain" style={{ width, height }} accessibilityLabel={chosen.name + ' vehicle'} />;
}
