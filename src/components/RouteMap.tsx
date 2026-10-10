import Svg, { Circle, Defs, LinearGradient, Path, Rect, Stop } from 'react-native-svg';
import { Text, View } from 'react-native';
import type { RoutePoint, SafetyEvent } from '../features/drives/types';

export function RouteMap({ points, hazards = [], accent, background }: { points: RoutePoint[]; hazards?: SafetyEvent[]; accent: string; background: string }) {
  const width = 340, height = 220, pad = 28;
  if (!points || points.length < 2) return <View style={{ height, borderRadius: 14, overflow: 'hidden', backgroundColor: background, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: '#66736D', fontSize: 11, fontWeight: '600' }}>No recorded route</Text></View>;
  const safe = points;
  const lats = safe.map((p) => p.latitude), lngs = safe.map((p) => p.longitude);
  const minLat = Math.min(...lats), maxLat = Math.max(...lats), minLng = Math.min(...lngs), maxLng = Math.max(...lngs);
  const xy = safe.map((p) => ({ x: pad + ((p.longitude - minLng) / Math.max(maxLng - minLng, .0001)) * (width - pad * 2), y: height - pad - ((p.latitude - minLat) / Math.max(maxLat - minLat, .0001)) * (height - pad * 2) }));
  const path = xy.map((p, i) => `${i ? 'L' : 'M'} ${p.x} ${p.y}`).join(' ');
  const hazardColor = { object: '#FFB020', police: '#58A6FF', crash: '#FF453A' } as const;
  const hazardPoints = hazards.filter((event) => event.type === 'road_hazard' && event.latitude != null && event.longitude != null).map((event) => ({ event, x: pad + (((event.longitude as number) - minLng) / Math.max(maxLng - minLng, .0001)) * (width - pad * 2), y: height - pad - (((event.latitude as number) - minLat) / Math.max(maxLat - minLat, .0001)) * (height - pad * 2) }));
  return <View style={{ height, borderRadius: 14, overflow: 'hidden' }}><Svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`}>
    <Defs><LinearGradient id="mapbg" x1="0" y1="0" x2="1" y2="1"><Stop offset="0" stopColor={background} /><Stop offset="1" stopColor={accent} stopOpacity="0.12" /></LinearGradient></Defs>
    <Rect width={width} height={height} fill="url(#mapbg)" />
    {[52, 104, 156].map((y) => <Path key={`h${y}`} d={`M 0 ${y} C 80 ${y-22}, 250 ${y+24}, 340 ${y-5}`} stroke="rgba(128,128,128,.18)" strokeWidth="2" fill="none" />)}
    {[70, 180, 280].map((x) => <Path key={`v${x}`} d={`M ${x} 0 C ${x+25} 70, ${x-20} 150, ${x+8} 220`} stroke="rgba(128,128,128,.14)" strokeWidth="2" fill="none" />)}
    <Path d={path} stroke={accent} strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    <Circle cx={xy[0].x} cy={xy[0].y} r="7" fill={background} stroke={accent} strokeWidth="4" />
    <Circle cx={xy[xy.length - 1].x} cy={xy[xy.length - 1].y} r="8" fill={accent} />
    {hazardPoints.map(({ event, x, y }) => <Circle key={event.id} cx={x} cy={y} r="10" fill={hazardColor[event.hazardKind ?? 'object']} stroke="#FFFFFF" strokeWidth="3" />)}
  </Svg></View>;
}
