import { useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import MapView, { Marker, Polyline, type MapView as MapHandle } from './DrivingMap.web';
import { demoRoute, demoPosition } from '../features/family/demoRoute';
import { useAppearance } from '../theme/AppearanceContext';

/** Fictional demo coordinates only; never requests the viewer's location. */
export function DemoLiveMap({ progress }: { progress: number }) {
  const { colors: c, mode } = useAppearance();
  const focused = useIsFocused();
  const map = useRef<MapHandle>(null);
  return <View style={{ gap: 8 }}>
    <View style={{ height: 230, borderRadius: 18, overflow: 'hidden', backgroundColor: c.mapSurface }}>
      {focused && <MapView ref={map} style={StyleSheet.absoluteFill} initialRegion={{ ...demoRoute[0], latitudeDelta: .015, longitudeDelta: .015 }} userInterfaceStyle={mode} interactive={false} onMapReady={() => map.current?.fitToCoordinates(demoRoute, { edgePadding: { top: 36, bottom: 36, left: 36, right: 36 }, animated: false })}>
        <Polyline coordinates={demoRoute} strokeColor="#FFFFFF" strokeWidth={9} />
        <Polyline coordinates={demoRoute} strokeColor={c.accent} strokeWidth={5} />
        <Marker coordinate={demoPosition(progress)} title="Child 2 · simulated location">
          <View accessibilityLabel="Child 2 simulated location" style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: c.accent, borderWidth: 3, borderColor: '#FFFFFF' }} />
        </Marker>
      </MapView>}
    </View>
    <Text style={{ color: c.textSecondary, fontSize: 11 }}>OpenFreeMap · fictional Raleigh route, not a real live location</Text>
  </View>;
}
