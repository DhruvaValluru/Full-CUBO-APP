import { Ionicons } from '@expo/vector-icons';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Fragment, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useDrives } from '../features/drives/DriveContext';
import { useAppearance } from '../theme/AppearanceContext';

const iconMap = {
  Home: 'home-outline',
  Map: 'map-outline',
} as const;

export const TabBar = ({ state, descriptors, navigation }: BottomTabBarProps) => {
  const insets = useSafeAreaInsets();
  const { colors } = useAppearance();
  const { activeSession } = useDrives();
  const rippleScale = useRef(new Animated.Value(.35)).current;
  const rippleOpacity = useRef(new Animated.Value(0)).current;
  const startRipple = () => {
    rippleScale.setValue(.35); rippleOpacity.setValue(.34);
    Animated.parallel([
      Animated.timing(rippleScale, { toValue: 2.15, duration: 520, useNativeDriver: true }),
      Animated.timing(rippleOpacity, { toValue: 0, duration: 520, useNativeDriver: true }),
    ]).start();
  };

  return (
    <View style={[styles.outer, { paddingBottom: Math.max(insets.bottom, 8), backgroundColor: colors.background, borderTopColor: colors.border }]}>
      {state.routes.map((route, index) => {
        const isFocused = state.index === index;
        const options = descriptors[route.key].options;
        const label =
          typeof options.tabBarLabel === 'string' ? options.tabBarLabel : options.title ?? route.name;

        const onPress = () => {
          const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!isFocused && !event.defaultPrevented) navigation.navigate(route.name);
        };

        const tab = <Pressable key={route.key} onPress={onPress} style={styles.item}>
            <Ionicons
              name={iconMap[route.name as keyof typeof iconMap]}
              size={20}
              color={isFocused ? colors.accent : colors.textTertiary}
            />
            <Text style={[styles.label, { color: isFocused ? colors.accent : colors.textTertiary }]}>{label}</Text>
          </Pressable>;
        if (index !== 0) return tab;
        return <Fragment key={route.key}>{tab}<Pressable style={styles.driveItem} onPressIn={startRipple} onPress={() => navigation.getParent()?.navigate('LiveDrive' as never)}>
          <View style={[styles.driveIcon, { backgroundColor: colors.accent }]}>
            <Animated.View pointerEvents="none" style={[styles.ripple, { backgroundColor: colors.accent, opacity: rippleOpacity, transform: [{ scale: rippleScale }] }]} />
            <Ionicons name={activeSession ? 'navigate' : 'play'} size={18} color={colors.onAccent} />
          </View>
          <Text style={[styles.label, { color: colors.text }]}>{activeSession ? 'Resume' : 'Start'}</Text>
        </Pressable></Fragment>;
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  outer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    paddingTop: 8,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    paddingVertical: 4,
  },
  driveItem: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 3, paddingVertical: 2 },
  driveIcon: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', overflow: 'visible' },
  ripple: { position: 'absolute', width: 38, height: 38, borderRadius: 19 },
  label: {
    fontSize: 10,
    fontWeight: '500',
    letterSpacing: 0.3,
  },
});
