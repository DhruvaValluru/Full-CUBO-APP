import { StyleSheet, View } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { demoRoute, demoPosition } from '../features/family/demoRoute';
import { useAppearance } from '../theme/AppearanceContext';
export function DemoLiveMap({ progress }: { progress: number }) {
  const { colors: c, mode } = useAppearance();
  return <View pointerEvents="none" style={{ height: 240, borderRadius: 20, overflow: 'hidden' }}>
    <MapView style={StyleSheet.absoluteFill} initialRegion={{ latitude: 35.7779, longitude: -78.6358, latitudeDelta: .009, longitudeDelta: .009 }} userInterfaceStyle={mode} scrollEnabled={false} zoomEnabled={false} rotateEnabled={false} pitchEnabled={false} showsCompass={false} toolbarEnabled={false}>
      <Polyline coordinates={demoRoute} strokeColor={c.accent} strokeWidth={5} />
      <Marker coordinate={demoPosition(progress)} anchor={{ x: .5, y: .5 }} title="Taylor · simulated location"><View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: '#2378D4', borderWidth: 4, borderColor: '#FFFFFF' }} /></Marker>
    </MapView>
  </View>;
}
