import { RouteMap } from './RouteMap';
import type { RoutePoint, SafetyEvent } from '../features/drives/types';

type Props = {
  points: RoutePoint[];
  hazards: SafetyEvent[];
  accent: string;
  background: string;
};

export function TripRouteSnapshot({ points, hazards, accent, background }: Props) {
  return <RouteMap points={points} hazards={hazards} accent={accent} background={background} />;
}
