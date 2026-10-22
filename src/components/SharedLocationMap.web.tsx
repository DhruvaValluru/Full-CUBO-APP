import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import MapView, { Marker, type MapView as MapHandle } from './DrivingMap.web';
import { useAppearance } from '../theme/AppearanceContext';
import { MotionPressable } from './MotionPressable';

export function SharedLocationMap({ latitude, longitude, name }: { latitude: number; longitude: number; name: string }) {
  const { colors, mode } = useAppearance();
  const focused = useIsFocused();
  const map = useRef<MapHandle>(null);
  const [moved, setMoved] = useState(false);
  const point = { latitude, longitude };
  const recenter = () => { map.current?.animateToRegion({ ...point, latitudeDelta: .012, longitudeDelta: .012 }, 320); setMoved(false); };
  useEffect(() => { if (focused) recenter(); }, [focused, latitude, longitude]);
  return <View style={[styles.frame, { backgroundColor: colors.mapSurface, borderColor: colors.border }]}>
    {focused ? <MapView ref={map} style={StyleSheet.absoluteFill} initialRegion={{ ...point, latitudeDelta: .012, longitudeDelta: .012 }} userInterfaceStyle={mode} interactive onPanDrag={() => setMoved(true)} attributionBottom={0}>
      <Marker coordinate={point} title={`${name}'s shared location`}><View accessibilityLabel={`${name}'s shared location`} style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: colors.accent, borderWidth: 4, borderColor: '#FFFFFF' }} /></Marker>
    </MapView> : null}
    <View pointerEvents="box-none" style={styles.overlay}>
      <View style={[styles.hint, { backgroundColor: colors.card }]}><Text style={[styles.hintText, { color: colors.textSecondary }]}>{moved ? 'Viewing nearby area' : 'Drag or pinch to explore'}</Text></View>
      <View style={[styles.controls, { backgroundColor: colors.card, borderColor: colors.borderStrong }]}>
        <MotionPressable accessibilityLabel="Zoom in" style={styles.control} onPress={() => map.current?.zoomBy(1)}><Ionicons name="add" size={20} color={colors.text} /></MotionPressable>
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <MotionPressable accessibilityLabel="Zoom out" style={styles.control} onPress={() => map.current?.zoomBy(-1)}><Ionicons name="remove" size={20} color={colors.text} /></MotionPressable>
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <MotionPressable accessibilityLabel={`Recenter on ${name}`} style={styles.control} onPress={recenter}><Ionicons name="locate" size={17} color={moved ? colors.accent : colors.textSecondary} /></MotionPressable>
      </View>
    </View>
  </View>;
}

const styles = StyleSheet.create({
  frame: { height: 230, borderRadius: 14, overflow: 'hidden', borderWidth: StyleSheet.hairlineWidth },
  overlay: { position: 'absolute', inset: 0, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', padding: 10 },
  hint: { minHeight: 30, borderRadius: 8, paddingHorizontal: 10, justifyContent: 'center', opacity: .92 },
  hintText: { fontFamily: 'Manrope_600SemiBold', fontSize: 9 },
  controls: { width: 42, borderRadius: 10, borderWidth: 1, overflow: 'hidden' },
  control: { width: 40, height: 39, alignItems: 'center', justifyContent: 'center' },
  divider: { height: StyleSheet.hairlineWidth },
});

