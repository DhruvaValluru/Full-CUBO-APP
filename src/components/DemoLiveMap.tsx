import { Text, View } from 'react-native';
import { RouteMap } from './RouteMap';
import { demoRoute, demoPosition } from '../features/family/demoRoute';
import { useAppearance } from '../theme/AppearanceContext';
export function DemoLiveMap({ progress }: { progress: number }) {
  const { colors: c } = useAppearance();
  const points = [...demoRoute.slice(0, Math.floor(progress * (demoRoute.length - 1)) + 1), demoPosition(progress)];
  return <View><RouteMap points={points} hazards={[]} accent={c.accent} background={c.mapSurface} /><Text style={{ color: c.textSecondary, fontSize: 11 }}>Route preview · street map available in the mobile app</Text></View>;
}
