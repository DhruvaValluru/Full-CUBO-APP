import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Easing, Platform, Pressable, StyleSheet, Text, View, type View as RNView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DriverCameraPreview } from '../components/DriverCameraPreview';
import { MotionPressable } from '../components/MotionPressable';
import { useWebFaceLandmarks } from '../hooks/useWebFaceLandmarks';
import { readCalibration } from '../features/calibration/calibrationStatus';
import { useDrives } from '../features/drives/DriveContext';
import type { RootStackParamList } from '../navigation/types';
import { useAppearance } from '../theme/AppearanceContext';
import type { AppColors } from '../theme/colors';

export function LiveDriveScreen({ navigation }: NativeStackScreenProps<RootStackParamList, 'LiveDrive'>) {
  const { colors: c } = useAppearance();
  const s = makeThemeStyles(c);

  const [calibrated, setCalibrated] = useState(false);
  useEffect(() => { let live = true; void readCalibration().then(value => { if (live) setCalibrated(Boolean(value)); }).catch(() => undefined); return () => { live = false; }; }, []);
  const camera = useWebFaceLandmarks();
  const { confirmCamera } = useDrives();
  const [nativeReady, setNativeReady] = useState(false);
  const progress = useRef(new Animated.Value(.6)).current;
  const ready = Platform.OS === 'web' ? camera.ready : nativeReady;
  const attach = useCallback((node: RNView | null) => { if (Platform.OS === 'web') camera.setHost(node as unknown as HTMLElement | null); }, [camera.setHost]);
  const onReady = useCallback(() => setNativeReady(true), []);
  useEffect(() => { Animated.timing(progress, { toValue: ready ? 1 : .1, duration: 260, easing: Easing.inOut(Easing.cubic), useNativeDriver: false }).start(); }, [ready, progress]);
  const home = () => navigation.goBack();
  return <SafeAreaView style={s.root}>
    <View style={s.header}><Pressable accessibilityLabel="Cancel camera check" style={s.back} onPress={home}><Ionicons name="chevron-back" size={22} color={c.text} /></Pressable><View><Text style={s.title}>Camera check</Text><Text style={s.sub}>Position your phone before you set off.</Text></View></View>
    <View style={s.camera}><DriverCameraPreview attachWebHost={attach} onReady={onReady} />{Platform.OS === 'web' && !ready ? <View style={{ position: 'absolute', left: 20, right: 20, top: '40%', alignItems: 'center' }}><MotionPressable onPress={() => camera.retry?.()} style={{ backgroundColor: c.accent, borderRadius: 16, paddingHorizontal: 24, minHeight: 48, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: '#FFFFFF', fontFamily: 'Manrope_700Bold' }}>Enable camera</Text></MotionPressable><Text style={{ color: '#CBD7D0', fontSize: 11, textAlign: 'center', lineHeight: 17, marginTop: 12 }}>Approve camera access in your browser. If blocked, check the site’s camera permission.</Text></View> : null}<View pointerEvents="none" style={s.tag}><View style={[s.dot, { backgroundColor: ready ? '#55B98B' : '#E5B455' }]} /><Text style={s.tagText}>{ready ? 'CAMERA READY' : 'WAITING FOR CAMERA'}</Text></View><View pointerEvents="none" style={s.cameraCaption}><Text style={s.caption}>Keep your face in view</Text><Text style={s.captionSub}>Use a stable mount with a clear view of the road.</Text></View></View>
    <View style={s.readiness}><View style={s.readinessRow}><Text style={s.readinessTitle}>Camera connection</Text><Text style={s.readinessStatus}>{ready ? 'Ready' : 'Waiting'}</Text></View><View style={s.track}><Animated.View style={[s.fill, { width: progress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) }]} /></View><Text style={s.note}>{Platform.OS === 'web' && camera.error ? camera.error : 'Experimental attention monitoring requires a calibrated camera and fresh GPS. Keep the app open; it cannot guarantee safety.'}</Text></View>
    <View style={s.footer}>{!calibrated ? <MotionPressable style={s.continue} onPress={() => navigation.replace('CameraCalibration')}><Text style={s.continueText}>Calibrate camera first</Text></MotionPressable> : <MotionPressable style={[s.continue, !ready && { opacity: .45 }]} scaleTo={.96} disabled={!ready} onPress={() => { confirmCamera(); navigation.goBack(); }}><Text style={s.continueText}>{ready ? 'Confirm camera & start' : 'Allow camera to continue'}</Text><Ionicons name="arrow-forward" size={19} color="#FFFFFF" /></MotionPressable>}</View>
  </SafeAreaView>;
}
const makeThemeStyles = (c: AppColors) => StyleSheet.create({
  root: { flex: 1, backgroundColor: c.background, paddingHorizontal: 20 }, header: { flexDirection: 'row', gap: 12, alignItems: 'center', paddingVertical: 16 }, back: { width: 44, height: 44, borderRadius: 14, backgroundColor: c.card, alignItems: 'center', justifyContent: 'center' }, title: { color: c.text, fontFamily: 'Manrope_800ExtraBold', fontSize: 21 }, sub: { color: c.textSecondary, fontSize: 10, marginTop: 3 },
  camera: { flex: 1, minHeight: 220, borderRadius: 28, overflow: 'hidden', backgroundColor: '#080A0D' }, tag: { position: 'absolute', top: 16, left: 16, flexDirection: 'row', alignItems: 'center', gap: 7, padding: 10, borderRadius: 12, backgroundColor: 'rgba(0,0,0,.58)' }, dot: { width: 6, height: 6, borderRadius: 3 }, tagText: { color: '#FFFFFF', fontSize: 8, fontFamily: 'Manrope_700Bold', letterSpacing: .8 }, cameraCaption: { position: 'absolute', left: 16, right: 16, bottom: 16, padding: 16, borderRadius: 18, backgroundColor: 'rgba(0,0,0,.62)' }, caption: { color: '#FFFFFF', fontFamily: 'Manrope_700Bold', fontSize: 15 }, captionSub: { color: '#D0D8D3', fontSize: 10, marginTop: 5 },
  readiness: { paddingVertical: 20 }, readinessRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }, readinessTitle: { color: c.text, fontFamily: 'Manrope_700Bold', fontSize: 12 }, readinessStatus: { color: c.accent, fontSize: 11 }, track: { height: 7, borderRadius: 4, backgroundColor: c.border, overflow: 'hidden' }, fill: { height: 7, borderRadius: 4, backgroundColor: c.accent }, note: { color: c.textSecondary, fontSize: 10, lineHeight: 16, marginTop: 10 }, footer: { paddingBottom: 8 }, continue: { minHeight: 54, borderRadius: 18, backgroundColor: c.accent, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 10 }, continueText: { color: c.onAccent, fontFamily: 'Manrope_800ExtraBold', fontSize: 14 }, home: { minHeight: 44, alignItems: 'center', justifyContent: 'center' }, homeText: { color: c.textSecondary, fontSize: 12 },
});
