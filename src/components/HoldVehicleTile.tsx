import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Animated, Easing, Pressable, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useAppearance } from '../theme/AppearanceContext';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const HOLD_MS = 750;
const CIRCUMFERENCE = 2 * Math.PI * 46;

/** Short tap selects; a deliberate hold opens details without changing selection. */
export function HoldVehicleTile({ children, label, selected, onSelect, onOpen }: { children: ReactNode; label: string; selected: boolean; onSelect: () => void; onOpen: () => void }) {
  const { colors } = useAppearance();
  const progress = useRef(new Animated.Value(0)).current;
  const opened = useRef(false); const cancelled = useRef(false);
  const start = useRef({ x: 0, y: 0 });
  const [holding, setHolding] = useState(false);
  useEffect(() => () => progress.stopAnimation(), [progress]);
  const stop = () => { progress.stopAnimation(); progress.setValue(0); setHolding(false); };
  return <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityHint="Tap to select. Hold to open vehicle details." accessibilityState={{ selected }}
    accessibilityActions={[{ name: 'activate', label: 'Select vehicle' }, { name: 'longpress', label: 'Open vehicle details' }]}
    onAccessibilityAction={event => event.nativeEvent.actionName === 'longpress' ? onOpen() : onSelect()}
    style={{ width: 100, alignItems: 'center' }} delayLongPress={HOLD_MS}
    onPressIn={event => { opened.current = false; cancelled.current = false; start.current = { x: event.nativeEvent.pageX, y: event.nativeEvent.pageY }; progress.setValue(0); setHolding(true); Animated.timing(progress, { toValue: 1, duration: HOLD_MS, easing: Easing.linear, useNativeDriver: false }).start(); }}
    onTouchMove={event => { if (Math.hypot(event.nativeEvent.pageX - start.current.x, event.nativeEvent.pageY - start.current.y) > 12) { cancelled.current = true; stop(); } }}
    onPressOut={stop}
    onLongPress={() => { if (!cancelled.current && !opened.current) { opened.current = true; stop(); onOpen(); } }}
    onPress={() => { if (!opened.current && !cancelled.current) onSelect(); }}>
    {children}
    {holding && <View pointerEvents="none" style={{ position: 'absolute', top: -4, left: 0 }}>
      <Svg width={100} height={100} viewBox="0 0 100 100">
        <Circle cx={50} cy={50} r={46} fill="none" stroke={colors.accentSoft} strokeWidth={4} />
        <AnimatedCircle cx={50} cy={50} r={46} fill="none" stroke={colors.accent} strokeWidth={4} strokeLinecap="round" strokeDasharray={CIRCUMFERENCE} strokeDashoffset={progress.interpolate({ inputRange: [0, 1], outputRange: [CIRCUMFERENCE, 0] })} rotation={-90} origin="50, 50" />
      </Svg>
    </View>}
  </Pressable>;
}
