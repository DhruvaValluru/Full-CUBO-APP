import { useEffect, useRef, useState } from 'react';
import { Animated, BackHandler, Easing, Keyboard, Platform, StyleSheet, View } from 'react-native';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { useAppearance } from '../theme/AppearanceContext';
import { AuthScreen } from './AuthScreen';
import { WelcomeScreen } from './WelcomeScreen';

/** Both screens share one transition so there is no blank frame between them. */
export function WelcomeFlow() {
  const { colors } = useAppearance();
  const reduced = useReducedMotion();
  const progress = useRef(new Animated.Value(0)).current;
  const locked = useRef(false);
  const [login, setLogin] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [moving, setMoving] = useState(false);

  const navigate = (next: boolean) => {
    if (locked.current || next === login) return;
    locked.current = true;
    Keyboard.dismiss();
    if (next) setMounted(true);
    setMoving(true);
    setLogin(next);
  };

  useEffect(() => {
    const animation = Animated.timing(progress, {
      toValue: login ? 1 : 0,
      duration: reduced ? 140 : login ? 440 : 340,
      easing: Easing.bezier(0.22, 1, 0.36, 1),
      useNativeDriver: Platform.OS !== 'web',
    });
    animation.start(({ finished }) => {
      if (!finished) return;
      locked.current = false;
      setMoving(false);
      if (!login) setMounted(false);
    });
    return () => animation.stop();
  }, [login, reduced, progress]);

  useEffect(() => {
    if (!login) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => { navigate(false); return true; });
    return () => sub.remove();
  }, [login]);

  return <View style={[styles.root, { backgroundColor: colors.background }]}>
    <Animated.View pointerEvents={login || moving ? 'none' : 'auto'} accessibilityElementsHidden={login} importantForAccessibility={login ? 'no-hide-descendants' : 'auto'}
      style={[styles.layer, login && !moving && { display: 'none' }, { opacity: progress.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }), transform: [{ translateX: progress.interpolate({ inputRange: [0, 1], outputRange: [0, reduced ? 0 : -28] }) }] }]}>
      <WelcomeScreen onGetStarted={() => navigate(true)} />
    </Animated.View>
    {mounted ? <Animated.View pointerEvents={!login || moving ? 'none' : 'auto'} accessibilityElementsHidden={!login} importantForAccessibility={!login ? 'no-hide-descendants' : 'auto'}
      style={[styles.layer, { opacity: progress, transform: [{ translateX: progress.interpolate({ inputRange: [0, 1], outputRange: [reduced ? 0 : 48, 0] }) }] }]}>
      <AuthScreen onBack={() => navigate(false)} />
    </Animated.View> : null}
  </View>;
}

const styles = StyleSheet.create({ root: { flex: 1, overflow: 'hidden' }, layer: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 } });
