import { StyleSheet, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { useAppearance } from '../theme/AppearanceContext';

export function SharedLocationMap({ latitude, longitude, name }: { latitude: number; longitude: number; name: string }) {
  const { colors, mode } = useAppearance();
  const point = { latitude, longitude };
  return <View pointerEvents="none" style={{ height: 230, borderRadius: 20, overflow: 'hidden', backgroundColor: colors.mapSurface }}>
    <MapView style={StyleSheet.absoluteFill} initialRegion={{ ...point, latitudeDelta: .012, longitudeDelta: .012 }} userInterfaceStyle={mode} scrollEnabled={false} zoomEnabled={false} rotateEnabled={false} pitchEnabled={false} showsCompass={false} toolbarEnabled={false}>
      <Marker coordinate={point} anchor={{ x: .5, y: .5 }} title={`${name}'s shared location`}><View style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: colors.accent, borderWidth: 4, borderColor: '#FFFFFF' }} /></Marker>
    </MapView>
  </View>;
}

