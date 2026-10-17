import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useMapSource, type MapSource } from '../features/maps/MapSourceContext';
import { useAppearance } from '../theme/AppearanceContext';
export function MapSourcePreference() {
  const { source, setSource, appleAvailable, error } = useMapSource();
  const { colors: c } = useAppearance();
  const [open, setOpen] = useState(false);
  return <View>
    <Pressable accessibilityRole="button" accessibilityLabel="Map source" accessibilityState={{ expanded: open }} onPress={() => setOpen(value => !value)} style={{ minHeight: 60, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      <Ionicons name="map-outline" size={20} color={c.textSecondary} /><Text style={{ flex: 1, color: c.text, fontSize: 14, fontFamily: 'Manrope_600SemiBold' }}>Map source</Text>
      <Text style={{ color: c.text, fontFamily: 'Manrope_600SemiBold' }}>{source === 'apple' ? 'Apple' : 'Web'}</Text><Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={17} color={c.textSecondary} />
    </Pressable>
    {open && <View accessibilityRole="radiogroup" accessibilityLabel="Map source">{(['apple', 'web'] as MapSource[]).map(option => {
      const disabled = option === 'apple' && !appleAvailable;
      return <Pressable key={option} accessibilityRole="radio" accessibilityState={{ checked: option === source, disabled }} disabled={disabled} onPress={() => { setSource(option); setOpen(false); }} style={{ minHeight: 52, padding: 12, borderRadius: 12, flexDirection: 'row', alignItems: 'center', backgroundColor: source === option ? c.accentSoft : 'transparent', opacity: disabled ? .55 : 1 }}>
        <View style={{ flex: 1 }}><Text style={{ color: c.text, fontFamily: 'Manrope_600SemiBold' }}>{option === 'apple' ? 'Apple' : 'Web'}</Text>{disabled && <Text style={{ fontSize: 11, color: c.textSecondary }}>Available in the iPhone app</Text>}</View>
        {source === option && <Ionicons name="checkmark" size={20} color={c.accent} />}
      </Pressable>;
    })}</View>}
    {!!error && <Text accessibilityRole="alert" style={{ color: c.danger, fontSize: 12, paddingBottom: 12 }}>{error}</Text>}
  </View>;
}
