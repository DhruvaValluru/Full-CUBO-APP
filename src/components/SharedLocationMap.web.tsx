import { useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import MapView, { Marker, type MapView as MapHandle } from './DrivingMap.web';
import { useAppearance } from '../theme/AppearanceContext';

export function SharedLocationMap({ latitude, longitude, name }: { latitude: number; longitude: number; name: string }) {
  const { colors, mode } = useAppearance();
  const focused = useIsFocused();
  const map = useRef<MapHandle>(null);
  const point = { latitude, longitude };
  return <View style={{ height: 230, borderRadius: 20, overflow: 'hidden', backgroundColor: colors.mapSurface }}>
    {focused ? <MapView ref={map} style={StyleSheet.absoluteFill} initialRegion={{ ...point, latitudeDelta: .012, longitudeDelta: .012 }} userInterfaceStyle={mode} interactive={false} attributionBottom={0}>
      <Marker coordinate={point} title={`${name}'s shared location`}><View accessibilityLabel={`${name}'s shared location`} style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: colors.accent, borderWidth: 4, borderColor: '#FFFFFF' }} /></Marker>
    </MapView> : null}
  </View>;
}

