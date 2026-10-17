import { Ionicons } from '@expo/vector-icons';
import { useMemo, useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import MapView, { Marker, Polyline, type DrivingMapHandle } from './NativeDrivingMap';
import type { RoutePoint, SafetyEvent } from '../features/drives/types';
import { eventMapStyle, tripMapData } from '../features/maps/tripMapData';
import { useAppearance } from '../theme/AppearanceContext';
type Props = { points: RoutePoint[]; hazards: SafetyEvent[]; accent: string; background: string };
export function TripRouteSnapshot({ points, hazards, accent, background }: Props) {
  const { mode, colors } = useAppearance();
  const data = useMemo(() => tripMapData(points, hazards), [points, hazards]);
  const mapRef = useRef<DrivingMapHandle>(null);
  const center = data.bounds[0];
  if (!center) return <View style={[styles.frame, { backgroundColor: background, alignItems: 'center', justifyContent: 'center' }]}><Text style={{ color: colors.textSecondary }}>No GPS locations recorded for this trip</Text></View>;
  const pins = [
    ...(data.route.length ? [{ ...data.route[0], label: 'S', title: 'Start', color: accent }, ...(data.route.length > 1 ? [{ ...data.route[data.route.length - 1], label: 'F', title: 'Finish', color: accent }] : [])] : []),
    ...data.events.map(event => ({ latitude: event.latitude!, longitude: event.longitude!, title: event.title, ...eventMapStyle(event), label: '' })),
  ];
  const fit = () => mapRef.current?.fitToCoordinates(data.bounds, { edgePadding: { top: 36, right: 36, bottom: 40, left: 36 }, animated: false });
  return <View><View style={[styles.frame, { backgroundColor: background }]}>
    <MapView ref={mapRef} active fallbackData={{ center, route: data.route, pins, mode, preview: true, attributionBottom: 0 }} style={StyleSheet.absoluteFill} initialRegion={{ ...center, latitudeDelta: .015, longitudeDelta: .015 }} onMapReady={fit} onLayout={fit} scrollEnabled={false} zoomEnabled={false} rotateEnabled={false} pitchEnabled={false} toolbarEnabled={false} showsCompass={false} userInterfaceStyle={mode}>
      {data.route.length > 1 && <><Polyline coordinates={data.route} strokeColor="#FFFFFF" strokeWidth={10} /><Polyline coordinates={data.route} strokeColor={accent} strokeWidth={6} /></>}
      {pins.map((pin, index) => <Marker key={index} coordinate={pin} title={pin.title}><View style={[styles.pin, { backgroundColor: pin.color }]}>{'icon' in pin ? <Ionicons name={pin.icon} size={16} color="#fff" /> : <Text style={{ color: '#fff', fontWeight: '700' }}>{pin.label}</Text>}</View></Marker>)}
    </MapView>
  </View><Text style={{ color: colors.textSecondary, fontSize: 11, marginTop: 8 }}>S · Start   F · Finish   {data.events.length} mapped event{data.events.length === 1 ? '' : 's'}{data.unlocated ? ` · ${data.unlocated} without GPS` : ''}</Text></View>;
}
const styles = StyleSheet.create({ frame: { height: 230, borderRadius: 18, overflow: 'hidden' }, pin: { width: 28, height: 28, borderRadius: 14, borderWidth: 2, borderColor: '#fff', alignItems: 'center', justifyContent: 'center' } });
