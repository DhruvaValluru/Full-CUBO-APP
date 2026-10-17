import { Ionicons } from '@expo/vector-icons';
import { useMemo, useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import MapView, { Marker, Polyline, type MapView as MapHandle } from './DrivingMap.web';
import { tripMapData, eventMapStyle } from '../features/maps/tripMapData';
import { useAppearance } from '../theme/AppearanceContext';
import type { RoutePoint, SafetyEvent } from '../features/drives/types';

type Props = {
  points: RoutePoint[];
  hazards: SafetyEvent[];
  accent: string;
  background: string;
};

export function TripRouteSnapshot({ points, hazards, accent, background }: Props) {
  const { mode, colors } = useAppearance();
  const data = useMemo(() => tripMapData(points, hazards), [points, hazards]);
  const ref = useRef<MapHandle>(null);
  const center = data.bounds[0];
  if (!center) return <View style={{ height: 230, backgroundColor: background, borderRadius: 18, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: colors.textSecondary }}>No GPS locations recorded for this trip</Text></View>;
  return <View><View style={{ height: 230, borderRadius: 18, overflow: 'hidden', backgroundColor: background }}>
    <MapView ref={ref} style={StyleSheet.absoluteFill} initialRegion={{ ...center, latitudeDelta: .015, longitudeDelta: .015 }} userInterfaceStyle={mode} interactive={false} attributionBottom={0} onMapReady={() => ref.current?.fitToCoordinates(data.bounds, { edgePadding: { top: 36, bottom: 40, left: 36, right: 36 }, animated: false })}>
      {data.route.length > 1 && <><Polyline coordinates={data.route} strokeColor="#FFFFFF" strokeWidth={10} /><Polyline coordinates={data.route} strokeColor={accent} strokeWidth={6} /></>}
      {data.route.length > 0 && <Marker coordinate={data.route[0]} title="Start"><View style={[pin, { backgroundColor: accent }]}><Text style={{ color: '#fff', fontWeight: '700' }}>S</Text></View></Marker>}
      {data.route.length > 1 && <Marker coordinate={data.route[data.route.length - 1]} title="Finish"><View style={[pin, { backgroundColor: accent }]}><Text style={{ color: '#fff', fontWeight: '700' }}>F</Text></View></Marker>}
      {data.events.map(event => { const meta = eventMapStyle(event); return <Marker key={event.id} coordinate={{ latitude: event.latitude!, longitude: event.longitude! }} title={event.title || meta.label} description={event.detail}><View accessibilityLabel={event.title || meta.label} style={[pin, { backgroundColor: meta.color }]}><Ionicons name={meta.icon} size={16} color="#FFFFFF" /></View></Marker>; })}
    </MapView>
  </View><Text style={{ color: colors.textSecondary, fontSize: 11, marginTop: 8 }}>S · Start   F · Finish   {data.events.length} mapped event{data.events.length === 1 ? '' : 's'}{data.unlocated ? ` · ${data.unlocated} without GPS` : ''}</Text></View>;
}
const pin = { width: 28, height: 28, borderRadius: 14, borderWidth: 2, borderColor: '#FFFFFF', alignItems: 'center' as const, justifyContent: 'center' as const };
