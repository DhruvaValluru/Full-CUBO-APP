import type { ReactNode } from 'react';
import { Pressable, type AccessibilityRole, type AccessibilityState, type GestureResponderEvent, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, Easing, withTiming } from 'react-native-reanimated';

import { useReducedMotion } from '../hooks/useReducedMotion';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type Props = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  onLongPress?: () => void;
  onPressIn?: (event: GestureResponderEvent) => void;
  onPressOut?: (event: GestureResponderEvent) => void;
  disabled?: boolean;
  accessibilityLabel?: string;
  accessibilityRole?: AccessibilityRole;
  accessibilityState?: AccessibilityState;
  scaleTo?: number;
};

export function MotionPressable({ children, style, onPress, onLongPress, onPressIn, onPressOut, disabled, accessibilityLabel, accessibilityState, accessibilityRole = 'button', scaleTo = 0.97 }: Props) {
  const reduced = useReducedMotion();
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value, transform: [{ scale: scale.value }] }));

  return (
    <AnimatedPressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole={accessibilityRole}
      accessibilityState={accessibilityState}
      aria-selected={accessibilityState?.selected}
      disabled={disabled}
      onPress={onPress}
      onLongPress={onLongPress}
      onPressIn={(event) => {
        scale.value = withTiming(reduced ? 1 : scaleTo, { duration: 100, easing: Easing.out(Easing.cubic) });
        opacity.value = withTiming(0.92, { duration: 100, easing: Easing.inOut(Easing.cubic) });
        onPressIn?.(event);
      }}
      onPressOut={(event) => {
        scale.value = withTiming(1, { duration: 180, easing: Easing.out(Easing.cubic) });
        opacity.value = withTiming(1, { duration: 180, easing: Easing.inOut(Easing.cubic) });
        onPressOut?.(event);
      }}
      style={[style, animatedStyle]}
    >
      {children}
    </AnimatedPressable>
  );
}
