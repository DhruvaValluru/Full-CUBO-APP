import { Ionicons } from '@expo/vector-icons';
import { useIsFocused } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, AppState, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AttentionCamera } from '../components/AttentionCamera';
import { MotionPressable } from '../components/MotionPressable';
import { AttentionAudio } from '../features/attention/attentionAudio';
import type { FaceSample } from '../features/attention/attentionPolicy';
import { advanceCalibrationTest, beginBaseline, beginLookAway, calibrationTimeout, freshFace, newCalibrationTest, type CalibrationTest } from '../features/calibration/calibrationTest';
import { saveCalibration } from '../features/calibration/calibrationStatus';
import { useDrives } from '../features/drives/DriveContext';
import type { RootStackParamList } from '../navigation/types';
import { useAppearance } from '../theme/AppearanceContext';
import type { AppColors } from '../theme/colors';

const alertMessage = 'Distraction detected. Look forward again.';
const stepCopy = {
  position: ['Try your attention alert', 'While parked, mount your phone with your whole face visible. We’ll learn your forward-facing position, then ask you to look away briefly.'],
  baseline: ['Look at the road ahead', 'Keep your eyes open and your head still for 3 seconds. Look forward in your normal driving position, not down at the preview.'],
  ready: ['Now test a distraction', 'Stay parked. Turn your head slightly left or right for about 3 seconds, keeping your face in view. You’ll hear an alert when the detector notices.'],
  away: ['Look away briefly', 'Turn your head slightly to either side and keep your eyes open. Hold until the alert, then look forward again.'],
  return: ['Look forward again', 'The detector noticed your head turn. Return to your normal forward-facing position with your eyes open.'],
  confirm: ['Did you hear the alert?', 'Your head turn and return were detected. Confirm that you heard the spoken warning before saving.'],
} as const;

export function CameraCalibrationScreen({ navigation }: NativeStackScreenProps<RootStackParamList, 'CameraCalibration'>) {
  const { colors } = useAppearance();
  const styles = makeStyles(colors);
  const focused = useIsFocused();
  const { activeSession } = useDrives();
  const [foreground, setForeground] = useState(AppState.currentState === 'active');
  const [test, setTest] = useState(newCalibrationTest);
  const state = useRef(test);
  const latest = useRef<FaceSample | null>(null);
  const audio = useRef<AttentionAudio | null>(null);
  const audioEpoch = useRef(0);
  const alive = useRef(true);
  const saveLock = useRef(false);
  const [ready, setReady] = useState(false);
  const [cameraMessage, setCameraMessage] = useState('Connecting camera and attention detector…');
  const [audioError, setAudioError] = useState('');
  const [saveError, setSaveError] = useState('');
  const [saving, setSaving] = useState(false);
  const [complete, setComplete] = useState(false);
  const active = focused && foreground && !activeSession && !complete;
  const enabled = useRef(active); enabled.current = active;
  const update = useCallback((next: CalibrationTest) => { state.current = next; setTest(next); }, []);
  const stopAudio = useCallback(() => { audioEpoch.current++; audio.current?.dispose(); audio.current = null; }, []);
  const speak = useCallback((message: string) => {
    const epoch = ++audioEpoch.current;
    setAudioError('');
    audio.current ??= new AttentionAudio();
    void audio.current.speak(message).catch(error => {
      if (alive.current && enabled.current && audioEpoch.current === epoch) setAudioError(error instanceof Error ? error.message : 'Sound could not play. Try Hear alert.');
    });
  }, []);
  useEffect(() => {
    alive.current = true;
    return () => { alive.current = false; stopAudio(); };
  }, [stopAudio]);
  useEffect(() => {
    const listener = AppState.addEventListener('change', value => setForeground(value === 'active'));
    const visibility = () => setForeground(!document.hidden);
    if (Platform.OS === 'web') document.addEventListener('visibilitychange', visibility);
    return () => { listener.remove(); if (Platform.OS === 'web') document.removeEventListener('visibilitychange', visibility); };
  }, []);
  useEffect(() => {
    if (active) return;
    stopAudio(); latest.current = null; setReady(false);
    if (!complete) update({ ...newCalibrationTest(), hint: activeSession ? 'Finish your drive and park before testing.' : 'Test paused. Begin again when you are ready and parked.' });
  }, [active, complete, activeSession, stopAudio, update]);
  useEffect(() => {
    if (!active) return;
    const timer = setInterval(() => {
      const now = Date.now();
      if (!latest.current || !freshFace(latest.current, now)) {
        setReady(false);
        if (latest.current && now - latest.current.at > 3000) setCameraMessage('Camera frames paused. Check the preview or retry the camera.');
      }
      const next = calibrationTimeout(state.current, now);
      if (next !== state.current) { stopAudio(); update(next); }
    }, 300);
    return () => clearInterval(timer);
  }, [active, stopAudio, update]);

  const onSample = useCallback((sample: FaceSample) => {
    if (!enabled.current) return;
    const now = Date.now();
    latest.current = sample; setReady(freshFace(sample, now));
    setCameraMessage(sample.face ? 'Face visible' : 'No face detected. Keep your whole face in view.');
    const result = advanceCalibrationTest(state.current, sample, now);
    if (result.state !== state.current) update(result.state);
    if (result.alert) speak(alertMessage);
  }, [update, speak]);
  const onStatus = useCallback((message: string) => {
    if (!enabled.current) return;
    latest.current = null; setReady(false); setCameraMessage(message);
    if (['baseline', 'away', 'return'].includes(state.current.phase)) {
      stopAudio(); update({ ...newCalibrationTest(), hint: 'Camera interrupted. Reconnect it, then begin again.' });
    }
  }, [stopAudio, update]);

  const begin = () => {
    if (!active || !latest.current || !freshFace(latest.current, Date.now())) return;
    setSaveError(''); update(beginBaseline(Date.now()));
    // Spoken from the user tap to enable subsequent browser audio in this visit.
    speak('Look forward with your eyes open.');
  };
  const startTest = () => {
    if (!active || !latest.current || !freshFace(latest.current, Date.now())) return;
    update(beginLookAway(state.current, Date.now()));
    speak('While parked, turn your head slightly to either side.');
  };
  const save = async () => {
    const current = state.current;
    if (saveLock.current || !active || current.phase !== 'confirm' || !current.baseline) return;
    saveLock.current = true; setSaving(true); setSaveError('');
    try {
      await saveCalibration(current.samples.length, current.baseline, true);
      if (alive.current) { stopAudio(); setComplete(true); }
    } catch { if (alive.current) setSaveError('Calibration could not be saved. Check device storage and try again.'); }
    finally { saveLock.current = false; if (alive.current) setSaving(false); }
  };
  const close = () => { stopAudio(); if (navigation.canGoBack()) navigation.goBack(); else navigation.navigate('MainTabs', { screen: 'Home' }); };
  const busy = ['baseline', 'away', 'return'].includes(test.phase);
  const step = ['position', 'baseline'].includes(test.phase) ? 0 : ['ready', 'away'].includes(test.phase) ? 1 : 2;
  const [title, body] = complete ? ['Calibration saved', 'You tested a real head-turn alert and returned to looking forward. Recalibrate if you move the phone.'] : stepCopy[test.phase];
  const buttonLabel = complete ? 'Done' : saving ? 'Saving…' : test.phase === 'confirm' ? 'I heard it — save calibration' : test.phase === 'ready' ? 'Start distraction test' : busy ? 'Test in progress…' : 'I’m parked — begin';
  const disabled = !complete && (Boolean(activeSession) || !foreground || saving || busy || (test.phase !== 'confirm' && !ready));
  return <SafeAreaView style={styles.page}>
    <View style={styles.topbar}>
      <MotionPressable accessibilityLabel="Close calibration" style={styles.close} onPress={close}><Ionicons name="close" size={22} color={colors.text} /></MotionPressable>
      <View style={styles.topCopy}><Text style={styles.title}>Camera calibration</Text><Text style={styles.subtitle}>Parked test · no driving required</Text></View>
    </View>
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.steps} accessibilityLabel={complete ? 'All calibration steps complete' : `Step ${step + 1} of 3`}>
        {['Look ahead', 'Test alert', 'Return'].map((label, index) => <View key={label} style={styles.step}>
          <View style={[styles.stepLine, (complete || index <= step) && styles.stepLineActive]} />
          <Text style={[styles.stepText, (complete || index === step) && styles.stepTextActive]}>{index + 1}. {label}</Text>
        </View>)}
      </View>
      <View style={styles.cameraShell}>
        {active ? <AttentionCamera previewFit="contain" onSample={onSample} onStatus={onStatus} /> : <View style={styles.cameraStopped}>
          <Ionicons name={complete ? 'checkmark-circle-outline' : 'videocam-off-outline'} size={48} color={colors.accent} />
          <Text style={styles.cameraStoppedText}>{complete ? 'Camera stopped · test complete' : 'Camera paused'}</Text>
        </View>}
        {active && /^(Loading|Connecting)/.test(cameraMessage) && <View pointerEvents="none" style={styles.cameraLoading}>
          <ActivityIndicator color={colors.accent} /><Text style={styles.cameraStoppedText}>Starting camera…</Text>
        </View>}
      </View>
      <View style={styles.cameraStatus}>
        <Ionicons name={complete || ready ? 'checkmark-circle-outline' : 'scan-outline'} size={18} color={complete || ready ? colors.accent : colors.textSecondary} />
        <Text style={styles.cameraStatusText}>{complete ? 'Baseline and alert check saved on this device' : ready ? 'Face visible · keep the phone steady' : cameraMessage}</Text>
      </View>
      <View style={styles.instruction} accessibilityLiveRegion="polite">
        <Text style={styles.instructionTitle}>{activeSession ? 'Finish your drive first' : title}</Text>
        <Text style={styles.instructionBody}>{activeSession ? 'This test asks you to look away. End the drive and park safely before starting calibration.' : body}</Text>
      </View>
      {busy && <View accessibilityRole="progressbar" accessibilityLabel="Current calibration step" accessibilityValue={{ min: 0, max: 100, now: Math.round(test.progress * 100) }} style={styles.track}><View style={[styles.progress, { width: `${test.progress * 100}%` }]} /></View>}
      {!complete && test.hint ? <Text style={styles.hint}>{test.hint}</Text> : null}
      {!complete && !activeSession && <View style={styles.audioRow}>
        <View style={styles.audioCopy}><Text style={styles.audioTitle}>Sound check</Text><Text style={styles.audioHint}>Turn up media volume. On iPhone, turn Silent Mode off.</Text></View>
        <MotionPressable disabled={!active || saving || busy} accessibilityLabel="Hear calibration alert" style={[styles.hear, busy && styles.disabled]} onPress={() => speak(alertMessage)}><Ionicons name="volume-high-outline" size={18} color={colors.accent} /><Text style={styles.hearText}>Hear alert</Text></MotionPressable>
      </View>}
      {audioError ? <Text accessibilityRole="alert" style={styles.error}>{audioError} If Bluetooth is connected, check that speaker too.</Text> : null}
      {saveError ? <Text accessibilityRole="alert" style={styles.error}>{saveError}</Text> : null}
      <Text style={styles.privacy}>Test only while parked. The 3 mph threshold still applies during drives. No test events affect your score. Images are discarded; only baseline measurements and test completion are saved. Detection is experimental, not a safety guarantee.</Text>
    </ScrollView>
    <View style={styles.actions}>
      <MotionPressable disabled={disabled} style={[styles.primary, disabled && styles.disabled]} onPress={() => { if (complete) close(); else if (test.phase === 'confirm') void save(); else if (test.phase === 'ready') startTest(); else begin(); }}>
        <Text style={styles.primaryText}>{buttonLabel}</Text>
        <Ionicons name={complete || test.phase === 'confirm' ? 'checkmark' : 'arrow-forward'} size={20} color={colors.onAccent} />
      </MotionPressable>
      {!complete && test.phase !== 'position' && !saving && <MotionPressable style={styles.restart} onPress={() => { stopAudio(); setSaveError(''); setAudioError(''); update(newCalibrationTest()); }}><Text style={styles.restartText}>Restart test</Text></MotionPressable>}
    </View>
  </SafeAreaView>;
}

const makeStyles = (c: AppColors) => StyleSheet.create({
  page: { flex: 1, backgroundColor: c.background },
  topbar: { paddingHorizontal: 16, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', gap: 12 },
  close: { width: 48, height: 48, borderRadius: 16, backgroundColor: c.card, borderWidth: 1, borderColor: c.border, alignItems: 'center', justifyContent: 'center' },
  topCopy: { flex: 1 }, title: { color: c.text, fontFamily: 'Manrope_800ExtraBold', fontSize: 19 },
  subtitle: { color: c.textSecondary, fontFamily: 'Manrope_500Medium', fontSize: 12, marginTop: 4 },
  content: { paddingHorizontal: 16, paddingBottom: 16, width: '100%', maxWidth: 560, alignSelf: 'center' },
  steps: { flexDirection: 'row', gap: 12, marginBottom: 16 }, step: { flex: 1, gap: 8 },
  stepLine: { height: 3, borderRadius: 2, backgroundColor: c.borderStrong }, stepLineActive: { backgroundColor: c.accent },
  stepText: { color: c.textSecondary, fontFamily: 'Manrope_500Medium', fontSize: 12 }, stepTextActive: { color: c.accent, fontFamily: 'Manrope_700Bold' },
  cameraShell: { width: '100%', aspectRatio: 4 / 3, borderRadius: 24, overflow: 'hidden', backgroundColor: '#090D0C', borderWidth: 1, borderColor: c.borderStrong },
  cameraLoading: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, alignItems: 'center', justifyContent: 'center', gap: 12, backgroundColor: '#090D0C' },
  cameraStopped: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  cameraStoppedText: { color: '#E2EEE8', fontFamily: 'Manrope_500Medium', fontSize: 13, textAlign: 'center' },
  cameraStatus: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12 },
  cameraStatusText: { color: c.textSecondary, fontFamily: 'Manrope_500Medium', fontSize: 12, lineHeight: 18, flex: 1 },
  instruction: { marginTop: 20, gap: 8 }, instructionTitle: { color: c.text, fontFamily: 'Manrope_800ExtraBold', fontSize: 22, lineHeight: 30 },
  instructionBody: { color: c.textSecondary, fontFamily: 'Manrope_500Medium', fontSize: 14, lineHeight: 22 },
  track: { height: 6, backgroundColor: c.surfaceMuted, borderRadius: 4, overflow: 'hidden', marginTop: 16 },
  progress: { height: '100%', backgroundColor: c.accent },
  hint: { color: c.text, fontFamily: 'Manrope_500Medium', fontSize: 13, lineHeight: 20, marginTop: 12 },
  audioRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 12, marginTop: 20, paddingTop: 16, borderTopWidth: 1, borderColor: c.border },
  audioCopy: { flex: 1, minWidth: 150 }, audioTitle: { color: c.text, fontFamily: 'Manrope_700Bold', fontSize: 14 },
  audioHint: { color: c.textSecondary, fontFamily: 'Manrope_500Medium', fontSize: 12, lineHeight: 18, marginTop: 4 },
  hear: { minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 12, borderRadius: 14, backgroundColor: c.accentSoft },
  hearText: { color: c.accent, fontFamily: 'Manrope_700Bold', fontSize: 12 },
  error: { color: c.warning, fontFamily: 'Manrope_500Medium', fontSize: 13, lineHeight: 20, marginTop: 12 },
  privacy: { color: c.textSecondary, fontFamily: 'Manrope_500Medium', fontSize: 12, lineHeight: 18, marginTop: 20 },
  actions: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8, borderTopWidth: 1, borderColor: c.border, backgroundColor: c.background },
  primary: { minHeight: 54, paddingVertical: 12, borderRadius: 18, backgroundColor: c.accent, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, paddingHorizontal: 20 },
  primaryText: { color: c.onAccent, fontFamily: 'Manrope_800ExtraBold', fontSize: 14, flexShrink: 1 },
  disabled: { opacity: .48 }, restart: { minHeight: 44, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  restartText: { color: c.textSecondary, fontFamily: 'Manrope_700Bold', fontSize: 13 },
});
