import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Platform, Pressable, StyleSheet, Text, View, type View as RNView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { StatusPill } from '../components/StatusPill';
import { ViewfinderCorners } from '../components/ViewfinderCorners';
import { useDrives } from '../features/drives/DriveContext';
import { demoStepCount, getDemoStep } from '../features/drives/demoEngine';
import type { LiveSafetyState, RoadHazardKind } from '../features/drives/types';
import { useWebFaceLandmarks } from '../hooks/useWebFaceLandmarks';
import { useDriveLocation } from '../hooks/useDriveLocation';
import type { RootStackParamList } from '../navigation/types';
import { useAppearance } from '../theme/AppearanceContext';
import type { AppColors } from '../theme/colors';
import { radii, spacing } from '../theme/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'LiveDrive'>;

export function LiveDriveScreen({ navigation }: Props) {
  const { colors } = useAppearance();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const toneByAttention = useMemo(() => ({ Attentive: colors.gaugeProgress, Caution: colors.amber, Warning: '#FF7A1A', Critical: colors.danger }), [colors]);
  const hazardOptions = useMemo<{ kind: RoadHazardKind; label: string; detail: string; icon: keyof typeof Ionicons.glyphMap; color: string }[]>(() => [
    { kind: 'object', label: 'Object', detail: 'Debris or stopped object', icon: 'cube-outline', color: colors.amber },
    { kind: 'police', label: 'Police', detail: 'Police activity ahead', icon: 'shield-outline', color: colors.blue },
    { kind: 'crash', label: 'Crash', detail: 'Collision or blocked lane', icon: 'warning-outline', color: colors.danger },
  ], [colors]);
  const { activeSession, startDrive, addEvent, updateDrive, endDrive, addRoutePoint } = useDrives();
  const [stepIndex, setStepIndex] = useState(0);
  const [state, setState] = useState<LiveSafetyState>(getDemoStep(0));
  const [hazardSaved, setHazardSaved] = useState<RoadHazardKind | null>(null);
  const [hazardMenu, setHazardMenu] = useState(false);
  const driveStateRef = useRef(state);
  driveStateRef.current = state;
  const pulse = useRef(new Animated.Value(1)).current;
  const lastCameraAlert = useRef(false);
  const camera = useWebFaceLandmarks();
  const gps = useDriveLocation(true);
  const cameraRef = useRef(camera);
  cameraRef.current = camera;

  const attachCamera = useCallback((node: RNView | null) => {
    if (Platform.OS === 'web') camera.setHost(node as unknown as HTMLElement | null);
  }, [camera.setHost]);

  const cameraAttention = useMemo<LiveSafetyState['attention']>(() => {
    if (!camera.ready || !camera.facePresent) return 'Caution';
    if (!camera.distracted) return 'Attentive';
    if (camera.dwellMs >= 1800) return 'Critical';
    if (camera.dwellMs >= 700) return 'Warning';
    return 'Caution';
  }, [camera.distracted, camera.dwellMs, camera.facePresent, camera.ready]);

  const displayedState = {
    ...state,
    attention: camera.ready ? cameraAttention : state.attention,
    focusScore: camera.ready ? camera.focusScore : state.focusScore,
    speedMph: gps.hasFix ? gps.speedMph : state.speedMph,
  };

  useEffect(() => {
    if (!activeSession) startDrive();
  }, [activeSession, startDrive]);

  useEffect(() => {
    const interval = setInterval(() => setStepIndex((value) => (value + 1) % demoStepCount), 3200);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const next = getDemoStep(stepIndex);
    setState(next);
    updateDrive({ durationSeconds: next.elapsedSeconds, focusScore: next.focusScore, distanceMiles: gps.hasFix ? Number(gps.distanceMiles.toFixed(3)) : Number((next.elapsedSeconds * next.speedMph / 3600).toFixed(2)) });
    if (next.event) addEvent({ ...next.event, elapsedSeconds: next.elapsedSeconds });
  }, [addEvent, gps.distanceMiles, gps.hasFix, stepIndex, updateDrive]);

  useEffect(() => {
    if (!gps.point) return;
    addRoutePoint(gps.point.latitude, gps.point.longitude, gps.speedMph);
  }, [addRoutePoint, gps.point?.timestamp]);

  useEffect(() => {
    if (camera.distracted && !lastCameraAlert.current) {
      addEvent({
        type: 'looking_away',
        severity: cameraAttention === 'Critical' ? 'critical' : 'warning',
        title: 'Driver attention shifted',
        detail: `Web camera detected the driver looking ${camera.headDirection.toLowerCase()}.`,
        elapsedSeconds: state.elapsedSeconds,
        speedMph: displayedState.speedMph,
        durationMs: camera.dwellMs,
      });
    }
    lastCameraAlert.current = camera.distracted;
  }, [addEvent, camera.distracted, camera.dwellMs, camera.headDirection, cameraAttention, displayedState.speedMph, state.elapsedSeconds]);

  useEffect(() => {
    const interval = setInterval(() => {
      const current = cameraRef.current;
      if (!current.ready) return;
      const drive = driveStateRef.current;
      updateDrive({
        durationSeconds: drive.elapsedSeconds,
        focusScore: current.focusScore,
        distanceMiles: gps.hasFix ? Number(gps.distanceMiles.toFixed(3)) : Number((drive.elapsedSeconds * drive.speedMph / 3600).toFixed(2)),
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [gps.distanceMiles, gps.hasFix, updateDrive]);

  useEffect(() => {
    if (displayedState.attention === 'Attentive') {
      pulse.stopAnimation(); pulse.setValue(1); return;
    }
    const animation = Animated.loop(Animated.sequence([
      Animated.timing(pulse, { toValue: 1.04, duration: 500, useNativeDriver: true }),
      Animated.timing(pulse, { toValue: 1, duration: 500, useNativeDriver: true }),
    ]));
    animation.start();
    return () => animation.stop();
  }, [displayedState.attention, pulse]);

  const finish = () => {
    const completed = endDrive();
    if (completed) navigation.replace('TripSummary', { sessionId: completed.id });
  };

  const reportHazard = (kind: RoadHazardKind) => {
    const option = hazardOptions.find((item) => item.kind === kind)!;
    const lastPoint = activeSession?.route[activeSession.route.length - 1];
    addEvent({ type: 'road_hazard', severity: kind === 'crash' ? 'warning' : 'info', title: `${option.label} reported ahead`, detail: `${option.detail}. Saved to this trip map for the future community hazard layer.`, elapsedSeconds: state.elapsedSeconds, speedMph: displayedState.speedMph, hazardDistanceMeters: 0, hazardKind: kind, latitude: lastPoint?.latitude ?? gps.point?.latitude ?? 35.7796, longitude: lastPoint?.longitude ?? gps.point?.longitude ?? -78.6382 });
    setHazardSaved(kind);
    setHazardMenu(false);
  };

  const accent = toneByAttention[displayedState.attention];
  const latestEvent = activeSession?.events[activeSession.events.length - 1];

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Pressable style={styles.close} onPress={() => navigation.goBack()}><Ionicons name="chevron-down" size={20} color={colors.text} /></Pressable>
        <View style={styles.headerCopy}><Text style={styles.headerTitle}>Live drive</Text><Text style={styles.headerSub}>Toyota Prius · CUBO Cruise 01</Text></View>
        <StatusPill label={camera.ready ? 'CAMERA LIVE' : 'STARTING'} tone={camera.ready ? 'success' : 'neutral'} />
      </View>

      <View style={styles.body}>
        <Animated.View style={[styles.cameraFeed, { borderColor: accent, transform: [{ scale: pulse }] }]}> 
          <View ref={attachCamera} collapsable={false} style={StyleSheet.absoluteFill} />
          <View style={styles.detectionZone} pointerEvents="none"><ViewfinderCorners alert={displayedState.attention === 'Warning' || displayedState.attention === 'Critical'} /></View>
          <View style={styles.feedTop}>
            <View style={styles.feedTag}><View style={[styles.feedDot, { backgroundColor: camera.ready ? colors.gaugeProgress : colors.amber }]} /><Text style={styles.feedTagText}>WEB CAMERA</Text></View>
            <Text style={[styles.attention, { color: accent }]}>{displayedState.attention.toUpperCase()}</Text>
          </View>
          <View style={styles.feedBottom}>
            <View><Text style={styles.cameraStatus}>{camera.error ? 'Camera unavailable' : camera.detectionStatus}</Text><Text style={styles.cameraDetail}>{camera.ready ? `Head ${camera.headDirection.toLowerCase()} · Gaze ${camera.eyeGaze.toLowerCase()}` : 'Allow camera access when prompted'}</Text></View>
            <View style={styles.miniScore}><Text style={styles.miniScoreValue}>{displayedState.focusScore}</Text><Text style={styles.miniScoreLabel}>FOCUS</Text></View>
          </View>
        </Animated.View>

        {camera.error ? <Text style={styles.cameraError}>{camera.error} Use Chrome on localhost and allow camera access.</Text> : null}

        <View style={styles.metrics}>
          <Metric icon="speedometer-outline" label={gps.hasFix ? 'GPS speed' : 'Demo speed'} value={`${displayedState.speedMph} mph`} />
          <Metric icon="warning-outline" label="Next hazard" value={`${Math.max(0.1, displayedState.hazardDistanceMeters / 1609).toFixed(1)} mi`} />
          <Metric icon="time-outline" label="Drive time" value={`0:${String(displayedState.elapsedSeconds).padStart(2, '0')}`} />
        </View>

        <View style={[styles.alertCard, { borderColor: `${accent}55` }]}> 
          <View style={[styles.alertIcon, { backgroundColor: `${accent}20` }]}><Ionicons name="pulse-outline" size={20} color={accent} /></View>
          <View style={styles.alertCopy}>
            <Text style={styles.alertEyebrow}>CONTEXT ENGINE</Text>
            <Text style={styles.alertTitle}>{latestEvent?.title ?? 'Monitoring driver and road'}</Text>
            <Text style={styles.alertText}>{latestEvent?.detail ?? 'CUBO is processing attention signals locally.'}</Text>
            <View style={styles.inlinePrivacy}><Ionicons name="navigate-circle-outline" size={11} color={gps.status === 'active' ? colors.gaugeProgress : colors.amber} /><Text style={styles.inlinePrivacyText}>{gps.status === 'active' ? `GPS active · ${gps.point?.accuracy?.toFixed(0) ?? '—'} m accuracy` : gps.status === 'weak' ? 'GPS signal is weak' : gps.status === 'denied' ? 'Location permission denied · demo speed active' : gps.status === 'unavailable' ? 'Location services unavailable · demo speed active' : gps.status === 'error' ? `GPS error · ${gps.error ?? 'demo speed active'}` : 'Acquiring GPS signal…'}</Text></View>
          </View>
        </View>
      </View>

      {hazardMenu ? <View style={styles.hazardSheet}><View style={styles.sheetHandle} /><View style={styles.sheetHeader}><View><Text style={styles.sheetEyebrow}>COMMUNITY ROAD LAYER</Text><Text style={styles.sheetTitle}>What’s ahead?</Text></View><Pressable style={styles.sheetClose} onPress={() => setHazardMenu(false)}><Ionicons name="close" size={18} color={colors.text} /></Pressable></View><Text style={styles.sheetBody}>CUBO will pin this report to your current route coordinates.</Text><View style={styles.hazardGrid}>{hazardOptions.map((option) => <Pressable key={option.kind} style={styles.hazardOption} onPress={() => reportHazard(option.kind)}><View style={[styles.hazardIcon, { backgroundColor: `${option.color}22` }]}><Ionicons name={option.icon} size={23} color={option.color} /></View><Text style={styles.hazardLabel}>{option.label}</Text><Text style={styles.hazardDetail}>{option.detail}</Text></Pressable>)}</View></View> : null}

      <View style={styles.footer}>
        <Pressable style={styles.reportButton} onPress={() => setHazardMenu(true)}><Ionicons name={hazardSaved ? 'checkmark-circle-outline' : 'megaphone-outline'} size={18} color={colors.text} /><Text style={styles.reportText}>{hazardSaved ? `${hazardOptions.find((item) => item.kind === hazardSaved)?.label} saved` : 'Report hazard'}</Text></Pressable>
        <Pressable style={styles.endButton} onPress={finish}><View style={styles.stopSquare} /><Text style={styles.endText}>End drive</Text></Pressable>
      </View>
    </SafeAreaView>
  );
}

function Metric({ icon, label, value }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string }) {
  const { colors } = useAppearance();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return <View style={styles.metric}><Ionicons name={icon} size={17} color={colors.textSecondary} /><Text style={styles.metricValue}>{value}</Text><Text style={styles.metricLabel}>{label}</Text></View>;
}

const makeStyles = (colors: AppColors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', gap: 11, paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.sm }, close: { width: 38, height: 38, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.card, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border }, headerCopy: { flex: 1 }, headerTitle: { color: colors.text, fontSize: 18, fontFamily: 'Manrope_800ExtraBold', fontWeight: '800', letterSpacing: -.35 }, headerSub: { color: colors.textSecondary, fontSize: 9, marginTop: 2 },
  body: { flex: 1, paddingHorizontal: spacing.lg, justifyContent: 'center', gap: 10 },
  cameraFeed: { height: 260, borderRadius: 28, overflow: 'hidden', borderWidth: 2, backgroundColor: '#080A0D', shadowColor: '#000', shadowOpacity: 0.28, shadowRadius: 22, shadowOffset: { width: 0, height: 10 } },
  detectionZone: { position: 'absolute', top: 58, left: 18, right: 18, bottom: 94 },
  feedTop: { position: 'absolute', top: 12, left: 12, right: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  feedTag: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 9, paddingVertical: 6, borderRadius: radii.pill, backgroundColor: 'rgba(0,0,0,0.58)' }, feedDot: { width: 6, height: 6, borderRadius: 3 }, feedTagText: { color: '#FFFFFF', fontSize: 8, fontWeight: '800', letterSpacing: 0.9 },
  attention: { fontSize: 10, fontWeight: '800', letterSpacing: 1.3, paddingHorizontal: 9, paddingVertical: 6, borderRadius: radii.pill, backgroundColor: 'rgba(0,0,0,0.58)' },
  feedBottom: { position: 'absolute', left: 12, right: 12, bottom: 12, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', padding: 12, borderRadius: 17, backgroundColor: 'rgba(7,10,15,0.78)', borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,255,255,.12)' }, cameraStatus: { color: '#FFFFFF', fontSize: 13, fontFamily: 'Manrope_700Bold', fontWeight: '700' }, cameraDetail: { color: '#A8AFBD', fontSize: 9, marginTop: 3 }, miniScore: { alignItems: 'center' }, miniScoreValue: { color: '#FFFFFF', fontSize: 25, fontFamily: 'Manrope_800ExtraBold' }, miniScoreLabel: { color: '#A8AFBD', fontSize: 7, fontWeight: '700', letterSpacing: 0.8 }, cameraError: { color: colors.amber, fontSize: 9, lineHeight: 13, marginTop: -5 },
  metrics: { flexDirection: 'row', gap: 8 }, metric: { flex: 1, alignItems: 'center', borderRadius: 17, backgroundColor: colors.card, paddingVertical: 11, gap: 2, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border }, metricValue: { color: colors.text, fontSize: 14, fontFamily: 'Manrope_700Bold', fontWeight: '700', marginTop: 2 }, metricLabel: { color: colors.textTertiary, fontSize: 8 },
  alertCard: { padding: 14, borderRadius: 18, backgroundColor: colors.card, borderWidth: 1, flexDirection: 'row', gap: 11, alignItems: 'flex-start' }, alertIcon: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }, alertCopy: { flex: 1 }, alertEyebrow: { color: colors.textTertiary, fontSize: 8, fontFamily: 'Manrope_700Bold', fontWeight: '800', letterSpacing: 1 }, alertTitle: { color: colors.text, fontSize: 13, fontFamily: 'Manrope_700Bold', fontWeight: '700', marginTop: 3 }, alertText: { color: colors.textSecondary, fontSize: 9, lineHeight: 14, marginTop: 2 }, inlinePrivacy: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 }, inlinePrivacyText: { color: colors.textTertiary, fontSize: 7 },
  hazardSheet: { position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 10, backgroundColor: colors.cardElevated, borderTopLeftRadius: 26, borderTopRightRadius: 26, paddingHorizontal: spacing.lg, paddingTop: 9, paddingBottom: 92, borderTopWidth: StyleSheet.hairlineWidth, borderColor: colors.borderStrong, shadowColor: '#000', shadowOpacity: .45, shadowRadius: 24, shadowOffset: { width: 0, height: -8 } }, sheetHandle: { width: 38, height: 4, borderRadius: 2, backgroundColor: colors.surfaceMuted, alignSelf: 'center', marginBottom: 14 }, sheetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, sheetEyebrow: { color: colors.accent, fontFamily: 'Manrope_700Bold', fontSize: 8, letterSpacing: 1.1 }, sheetTitle: { color: colors.text, fontFamily: 'Manrope_800ExtraBold', fontSize: 22, marginTop: 2 }, sheetClose: { width: 36, height: 36, borderRadius: 12, backgroundColor: colors.surfaceMuted, alignItems: 'center', justifyContent: 'center' }, sheetBody: { color: colors.textSecondary, fontSize: 10, lineHeight: 15, marginTop: 5 }, hazardGrid: { flexDirection: 'row', gap: 8, marginTop: 14 }, hazardOption: { flex: 1, minHeight: 122, borderRadius: 17, backgroundColor: colors.surfaceMuted, padding: 11, alignItems: 'center' }, hazardIcon: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 8 }, hazardLabel: { color: colors.text, fontFamily: 'Manrope_700Bold', fontSize: 12 }, hazardDetail: { color: colors.textTertiary, fontSize: 8, lineHeight: 12, textAlign: 'center', marginTop: 4 },
  footer: { paddingHorizontal: spacing.lg, paddingTop: 11, paddingBottom: spacing.lg, flexDirection: 'row', gap: 9, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border, backgroundColor: colors.background }, reportButton: { flex: 1, minHeight: 54, borderRadius: 17, backgroundColor: colors.card, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border, flexDirection: 'row', gap: 7, alignItems: 'center', justifyContent: 'center' }, reportText: { color: colors.text, fontSize: 12, fontFamily: 'Manrope_700Bold', fontWeight: '600' }, endButton: { flex: 1, minHeight: 54, borderRadius: 17, backgroundColor: colors.accent, flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center' }, stopSquare: { width: 10, height: 10, borderRadius: 2, backgroundColor: colors.onAccent }, endText: { color: colors.onAccent, fontSize: 12, fontFamily: 'Manrope_800ExtraBold', fontWeight: '700' },
});
