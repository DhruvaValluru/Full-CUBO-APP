import { Ionicons } from '@expo/vector-icons';
import { useMemo, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import MapView, { Marker, Polyline, type Region } from 'react-native-maps';

import type { RoadHazardKind, RoutePoint, SafetyEvent } from '../features/drives/types';

type Props = {
  points: RoutePoint[];
  hazards: SafetyEvent[];
  accent: string;
  background: string;
};

const hazardMeta: Record<RoadHazardKind, { icon: keyof typeof Ionicons.glyphMap; color: string }> = {
  object: { icon: 'cube-outline', color: '#FFB020' },
  police: { icon: 'shield-outline', color: '#3D8DFF' },
  crash: { icon: 'warning-outline', color: '#FF453A' },
};

import { useAppearance } from '../theme/AppearanceContext';
export function TripRouteSnapshot({ points, hazards, accent }: Props) {
  const { mode } = useAppearance();
  const mapRef = useRef<MapView>(null);
  const route = points.length > 1 ? points : [];
  const initialRegion = useMemo<Region>(() => {
    const point = route[0] ?? { latitude: 35.7796, longitude: -78.6382 };
    return { latitude: point.latitude, longitude: point.longitude, latitudeDelta: .025, longitudeDelta: .025 };
  }, [route]);
  const fitRoute = () => {
    if (route.length > 1) mapRef.current?.fitToCoordinates(route, { edgePadding: { top: 34, right: 34, bottom: 34, left: 34 }, animated: false });
  };

  return (
    <View pointerEvents="none" style={styles.frame}>
      <MapView ref={mapRef} style={StyleSheet.absoluteFill} initialRegion={initialRegion} onMapReady={fitRoute} onLayout={fitRoute} scrollEnabled={false} zoomEnabled={false} rotateEnabled={false} pitchEnabled={false} toolbarEnabled={false} showsCompass={false} showsScale={false} showsMyLocationButton={false} userInterfaceStyle={mode}>
        {route.length > 1 ? <><Polyline coordinates={route} strokeColor="rgba(255,255,255,.94)" strokeWidth={10} lineCap="round" lineJoin="round" /><Polyline coordinates={route} strokeColor={accent} strokeWidth={6} lineCap="round" lineJoin="round" /><Marker coordinate={route[0]} anchor={{ x: .5, y: .5 }}><View style={[styles.start, { borderColor: accent }]} /></Marker><Marker coordinate={route[route.length - 1]} anchor={{ x: .5, y: .5 }}><View style={[styles.finish, { backgroundColor: accent }]} /></Marker></> : null}
        {hazards.filter((event) => event.latitude != null && event.longitude != null).map((event) => { const meta = hazardMeta[event.hazardKind ?? 'object']; return <Marker key={event.id} coordinate={{ latitude: event.latitude!, longitude: event.longitude! }}><View style={[styles.hazard, { backgroundColor: meta.color }]}><Ionicons name={meta.icon} size={13} color="#FFFFFF" /></View></Marker>; })}
      </MapView>
      {!route.length ? <View style={styles.empty}><Ionicons name="map-outline" size={22} color="#66736D" /></View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { height: 210, borderRadius: 18, overflow: 'hidden', backgroundColor: '#E8EEE9' },
  start: { width: 16, height: 16, borderRadius: 8, backgroundColor: '#FFFFFF', borderWidth: 4 },
  finish: { width: 17, height: 17, borderRadius: 9, borderWidth: 3, borderColor: '#FFFFFF' },
  hazard: { width: 28, height: 28, borderRadius: 14, borderWidth: 2, borderColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
  empty: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center', backgroundColor: '#E8EEE9' },
});
