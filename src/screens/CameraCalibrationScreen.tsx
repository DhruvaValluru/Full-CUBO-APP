import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Platform, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CalibrationCamera, type CalibrationCameraHandle } from '../components/CalibrationCamera';
import { MotionPressable } from '../components/MotionPressable';
import { saveCalibration } from '../features/calibration/calibrationStatus';
import type { RootStackParamList } from '../navigation/types';
import { useAppearance } from '../theme/AppearanceContext';
import type { AppColors } from '../theme/colors';

type Phase = 'position' | 'capturing' | 'complete';
const steps = ['Center your face', 'Check cabin framing', 'Confirm mount stability'];

export function CameraCalibrationScreen({ navigation }: NativeStackScreenProps<RootStackParamList, 'CameraCalibration'>) {
  const { colors } = useAppearance();
  const styles = makeStyles(colors);
  const camera = useRef<CalibrationCameraHandle>(null);
  const alive = useRef(true);
  const progress = useRef(new Animated.Value(0)).current;
  const successScale = useRef(new Animated.Value(.7)).current;
  const [ready, setReady] = useState(false);
  const [phase, setPhase] = useState<Phase>('position');
  const [sample, setSample] = useState(0);
  const [message, setMessage] = useState('Place your phone in its driving mount and keep your normal seating position.');

  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);
  useEffect(() => {
    if (phase !== 'complete') return;
    const timer = setTimeout(() => navigation.popTo('MainTabs', { screen: 'Home' }), 1200);
    return () => clearTimeout(timer);
  }, [phase, navigation]);

  const begin = async () => {
    if (!ready || phase !== 'position') return;
    setPhase('capturing');
    setMessage('Hold still while CUBO captures three local reference frames.');
    Animated.timing(progress, { toValue: 1, duration: 3100, easing: Easing.inOut(Easing.cubic), useNativeDriver: false }).start();
    for (let index = 0; index < steps.length; index += 1) {
      if (!alive.current) return;
      setSample(index + 1);
      setMessage(steps[index]);
      await new Promise(resolve => setTimeout(resolve, 850));
      if (!alive.current) return;
      try {
        if (!camera.current) throw new Error('Camera is unavailable. Please retry.');
        await camera.current.captureFrame();
      } catch (error) {
        if (!alive.current) return;
        progress.stopAnimation(); progress.setValue(0);
        setPhase('position');
        setMessage(error instanceof Error ? error.message : 'Frame capture failed. Please retry.');
        return;
      }
    }
    if (!alive.current) return;
    try { await saveCalibration(steps.length); }
    catch { if (alive.current) { setPhase('position'); progress.setValue(0); setMessage('Could not save setup. Please try again.'); } return; }
    if (!alive.current) return;
    setPhase('complete');
    setMessage('Your camera framing check is complete.');
    Animated.spring(successScale, { toValue: 1, damping: 13, stiffness: 170, useNativeDriver: true }).start();
  };

  return <SafeAreaView style={styles.page}>
    <View style={styles.topbar}>
      <MotionPressable accessibilityLabel="Close calibration" style={styles.close} onPress={() => navigation.goBack()}><Ionicons name="close" size={22} color={colors.text} /></MotionPressable>
      <View style={styles.topCopy}><Text style={styles.title}>Camera calibration</Text><Text style={styles.subtitle}>Driver and cabin frame setup</Text></View>
      <View style={[styles.status, ready && styles.statusReady]}><View style={[styles.statusDot, ready && styles.statusDotReady]} /><Text style={[styles.statusText, ready && styles.statusTextReady]}>{ready ? 'LIVE' : 'WAITING'}</Text></View>
    </View>

    <View style={styles.cameraShell}>
      <CalibrationCamera ref={camera} onReady={() => setReady(true)} onUnavailable={message => { setReady(false); setMessage(message); }} />
      <View pointerEvents="none" style={styles.shade} />
      <View pointerEvents="none" style={styles.faceGuide} />
      <View pointerEvents="none" style={styles.horizon} />
      <View pointerEvents="none" style={styles.cornerTL} /><View pointerEvents="none" style={styles.cornerTR} /><View pointerEvents="none" style={styles.cornerBL} /><View pointerEvents="none" style={styles.cornerBR} />

      {phase === 'complete' ? <View pointerEvents="none" style={styles.successOverlay}><Animated.View style={[styles.successMark, { transform: [{ scale: successScale }] }]}><Ionicons name="checkmark" size={42} color="#FFFFFF" /></Animated.View><Text style={styles.successTitle}>Calibration finished</Text><Text style={styles.successBody}>Camera framing check saved on this device.</Text></View> : null}

      <View pointerEvents="none" style={styles.cameraFooter}>
        <View style={styles.footerHeading}><Text style={styles.cameraLabel}>{phase === 'complete' ? 'CAMERA READY' : phase === 'capturing' ? `REFERENCE ${sample} OF ${steps.length}` : 'SETUP PREVIEW'}</Text><Text style={styles.cameraValue}>{phase === 'complete' ? 'Ready' : ready ? 'Live preview' : 'Connecting'}</Text></View>
        <View style={styles.track}><Animated.View style={[styles.progress, { width: phase === 'position' ? (ready ? '18%' : '4%') : progress.interpolate({ inputRange: [0, 1], outputRange: ['18%', '100%'] }) }]} /></View>
      </View>
    </View>

    <View style={styles.instructions}>
      <View style={styles.instructionIcon}><Ionicons name={phase === 'complete' ? 'shield-checkmark-outline' : 'scan-outline'} size={23} color={colors.accent} /></View>
      <View style={{ flex: 1 }}><Text style={styles.instructionTitle}>{phase === 'complete' ? 'Setup complete' : phase === 'capturing' ? 'Keep the mount steady' : 'Frame the driver and road'}</Text><Text style={styles.instructionBody}>{message}</Text></View>
    </View>

    <View style={styles.privacy}><Ionicons name="lock-closed-outline" size={14} color={colors.textSecondary} /><Text style={styles.privacyText}>{Platform.OS === 'web' ? 'Frames are checked in memory and discarded. Only the setup time is saved; this is not an attention-detection calibration.' : 'Reference frames remain on this device and are never added to your trip map.'}</Text></View>

    <View style={styles.actions}>
      {phase === 'complete' ? <MotionPressable style={styles.primary} onPress={() => navigation.goBack()}><Text style={styles.primaryText}>Done</Text><Ionicons name="checkmark" size={20} color="#FFFFFF" /></MotionPressable> : <MotionPressable disabled={!ready || phase === 'capturing'} style={[styles.primary, (!ready || phase === 'capturing') && styles.disabled]} onPress={() => void begin()}><Text style={styles.primaryText}>{phase === 'capturing' ? 'Calibrating…' : ready ? 'Start calibration' : 'Waiting for camera'}</Text><Ionicons name="arrow-forward" size={20} color="#FFFFFF" /></MotionPressable>}
    </View>
  </SafeAreaView>;
}

const makeStyles = (c: AppColors) => StyleSheet.create({
  page: { flex: 1, backgroundColor: c.background, paddingHorizontal: 16 },
  topbar: { minHeight: 78, flexDirection: 'row', alignItems: 'center', gap: 12 }, close: { width: 44, height: 44, borderRadius: 15, backgroundColor: c.card, borderWidth: 1, borderColor: c.border, alignItems: 'center', justifyContent: 'center' },
  topCopy: { flex: 1 }, title: { color: c.text, fontFamily: 'Manrope_800ExtraBold', fontSize: 19 }, subtitle: { color: c.textSecondary, fontSize: 11, marginTop: 3 },
  status: { flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 32, paddingHorizontal: 10, borderRadius: 12, backgroundColor: c.surfaceMuted }, statusReady: { backgroundColor: c.accentSoft }, statusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: c.textTertiary }, statusDotReady: { backgroundColor: c.accent }, statusText: { color: c.textSecondary, fontFamily: 'Manrope_800ExtraBold', fontSize: 9, letterSpacing: 1 }, statusTextReady: { color: c.accent },
  cameraShell: { flex: 1, minHeight: 350, maxHeight: 450, borderRadius: 30, overflow: 'hidden', backgroundColor: '#090D0C', borderWidth: 1, borderColor: c.accent }, shade: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: 'rgba(3, 12, 9, .12)' },
  faceGuide: { position: 'absolute', width: 148, height: 194, borderRadius: 74, borderWidth: 1.5, borderColor: 'rgba(150, 224, 192, .72)', top: 60, alignSelf: 'center' }, horizon: { position: 'absolute', left: 42, right: 42, top: 270, height: 1, backgroundColor: 'rgba(255,255,255,.3)' },
  cornerTL: { position: 'absolute', left: 24, top: 24, width: 32, height: 32, borderLeftWidth: 3, borderTopWidth: 3, borderColor: '#70D3A7' }, cornerTR: { position: 'absolute', right: 24, top: 24, width: 32, height: 32, borderRightWidth: 3, borderTopWidth: 3, borderColor: '#70D3A7' }, cornerBL: { position: 'absolute', left: 24, bottom: 96, width: 32, height: 32, borderLeftWidth: 3, borderBottomWidth: 3, borderColor: '#70D3A7' }, cornerBR: { position: 'absolute', right: 24, bottom: 96, width: 32, height: 32, borderRightWidth: 3, borderBottomWidth: 3, borderColor: '#70D3A7' },
  cameraFooter: { position: 'absolute', left: 12, right: 12, bottom: 12, padding: 16, borderRadius: 20, backgroundColor: 'rgba(8, 17, 13, .88)' }, footerHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, cameraLabel: { color: '#A9CDBB', fontFamily: 'Manrope_800ExtraBold', fontSize: 9, letterSpacing: 1.4 }, cameraValue: { color: '#FFFFFF', fontFamily: 'Manrope_700Bold', fontSize: 12 }, track: { height: 5, backgroundColor: 'rgba(255,255,255,.12)', borderRadius: 3, overflow: 'hidden', marginTop: 12 }, progress: { height: '100%', backgroundColor: '#62C89B', borderRadius: 3 },
  successOverlay: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(5, 18, 13, .74)', paddingBottom: 60 }, successMark: { width: 78, height: 78, borderRadius: 39, backgroundColor: '#24845F', alignItems: 'center', justifyContent: 'center', borderWidth: 5, borderColor: 'rgba(255,255,255,.18)' }, successTitle: { color: '#FFFFFF', fontFamily: 'Manrope_800ExtraBold', fontSize: 24, marginTop: 18 }, successBody: { color: '#C8D9D0', fontSize: 12, lineHeight: 18, textAlign: 'center', maxWidth: 250, marginTop: 6 },
  instructions: { flexDirection: 'row', gap: 12, padding: 14, borderRadius: 20, backgroundColor: c.card, borderWidth: 1, borderColor: c.border, marginTop: 12 }, instructionIcon: { width: 42, height: 42, borderRadius: 14, backgroundColor: c.accentSoft, alignItems: 'center', justifyContent: 'center' }, instructionTitle: { color: c.text, fontFamily: 'Manrope_800ExtraBold', fontSize: 14 }, instructionBody: { color: c.textSecondary, fontSize: 11, lineHeight: 16, marginTop: 3 },
  privacy: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, paddingVertical: 12, paddingHorizontal: 12 }, privacyText: { color: c.textSecondary, fontSize: 10, lineHeight: 15, flexShrink: 1 },
  actions: { paddingBottom: 8 }, primary: { minHeight: 54, borderRadius: 18, backgroundColor: c.accent, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, shadowColor: c.shadow, shadowOpacity: .18, shadowRadius: 16, shadowOffset: { width: 0, height: 7 }, elevation: 5 }, primaryText: { color: '#FFFFFF', fontFamily: 'Manrope_800ExtraBold', fontSize: 14 }, disabled: { opacity: .48 },
});
