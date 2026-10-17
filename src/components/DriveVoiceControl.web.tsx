import { useEffect, useRef, useState } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useAppearance } from '../theme/AppearanceContext';

import { useAuth } from '../features/auth/AuthContext';
import { useDrives } from '../features/drives/DriveContext';
import { useVehicles } from '../features/vehicles/VehicleContext';
import { insuranceProviders } from '../features/insurance/InsuranceContext';
import { accountContext } from '../features/cuboAI/appContext';
import { CuboAIVoice } from '../features/cuboAI/browserVoice';
import { DriveCommands, type DriveVoiceSnapshot } from '../features/cuboAI/driveCommands';
import { DriveConversation } from '../features/cuboAI/driveConversation';
import { readVoicePreference } from '../features/cuboAI/voicePreference';
import type { LocalAnswerDetails } from '../features/cuboAI/quickAnswers';

type Props = { live: Pick<DriveVoiceSnapshot, 'point' | 'gpsValid' | 'speed' | 'nextTurn'>; onStatus: (text: string) => void };
export function DriveVoiceControl(props: Props) {
  const { user } = useAuth(); const { activeSession } = useDrives();
  return user && activeSession ? <Control key={`${user.uid}:${activeSession.id}`} {...props} uid={user.uid} tripId={activeSession.id} /> : null;
}
function Control({ live, onStatus, uid, tripId }: Props & { uid: string; tripId: string }) {
  const { colors: c } = useAppearance();
  const focused = useIsFocused(); const { user } = useAuth();
  const { activeSession, sessions, monitoringStatus, addEvent } = useDrives();
  const { vehicles, ready } = useVehicles();
  const [details, setDetails] = useState<LocalAnswerDetails>({});
  const [enabled, setEnabled] = useState(false); const [notice, setNotice] = useState(false);
  const conversation = useRef<DriveConversation | null>(null); const voice = useRef<CuboAIVoice | null>(null);
  const latest = useRef({ user, activeSession, focused, live, details, vehicles, ready, sessions, monitoringStatus, addEvent, onStatus });
  latest.current = { user, activeSession, focused, live, details, vehicles, ready, sessions, monitoringStatus, addEvent, onStatus };
  const alive = useRef(false);
  const allowed = () => alive.current && latest.current.user?.uid === uid && latest.current.activeSession?.id === tripId && latest.current.focused && !document.hidden;
  useEffect(() => {
    let current = true;
    void Promise.all([AsyncStorage.getItem(`cubo-places:${uid}`), AsyncStorage.getItem(`cubo-insurance:${uid}`)]).then(([p, i]) => {
      const places = p ? JSON.parse(p) : {}; const insurance = i ? JSON.parse(i) : {};
      const place = (value: { title?: string; subtitle?: string } | undefined) => [value?.title, value?.subtitle].filter(v => typeof v === 'string').join(', ').slice(0, 240);
      if (current) setDetails({ ready: true, home: place(places?.home), work: place(places?.work), insurer: insurance?.providerId === 'other' ? insurance.customProviderName : insuranceProviders.find(p => p.id === insurance?.providerId)?.name, mode: insurance?.mode, cadence: insurance?.cadence });
    }).catch(() => {});
    return () => { current = false; };
  }, [uid]);
  useEffect(() => {
    alive.current = true; voice.current = new CuboAIVoice(allowed, () => readVoicePreference(localStorage, uid));
    const hidden = () => { if (document.hidden) { conversation.current?.stop('Voice off · app hidden'); setNotice(false); } };
    const warning = () => conversation.current?.stop('Voice off · attention warning');
    document.addEventListener('visibilitychange', hidden); window.addEventListener('cubo-attention-warning', warning);
    return () => { alive.current = false; conversation.current?.stop(); voice.current?.dispose(); document.removeEventListener('visibilitychange', hidden); window.removeEventListener('cubo-attention-warning', warning); };
  }, [uid, tripId]);
  useEffect(() => { if (!focused) { conversation.current?.stop(); setNotice(false); } }, [focused]);
  function start() {
    setNotice(false);
    if (!allowed() || !voice.current) return;
    if (!voice.current.supported().input || !voice.current.supported().output) { onStatus('Voice unavailable in this browser. Use the controls when parked.'); return; }
    conversation.current?.stop(); const commands = new DriveCommands();
    conversation.current = new DriveConversation(voice.current, allowed, text => {
      if (!allowed()) throw Error('Drive ended');
      const v = latest.current; const trip = v.activeSession!;
      const fresh = !!v.live.point && Date.now() - v.live.point.timestamp <= 15000;
      const result = commands.answer(text, { ...v.live, gpsValid: v.live.gpsValid && fresh, tripId, durationSeconds: trip.durationSeconds, distanceMiles: trip.distanceMiles, score: trip.attentionMeasured ? trip.focusScore : undefined, monitoring: v.monitoringStatus, details: v.details, account: accountContext({ name: v.user?.displayName, vehicles: v.vehicles, vehiclesReady: v.ready, sessions: v.sessions, calibration: 'unknown' }) });
      if (result.report) {
        if (!allowed() || result.report.tripId !== trip.id) throw Error('Drive changed');
        v.addEvent({ type: 'road_hazard', hazardKind: result.report.kind, severity: result.report.kind === 'crash' ? 'warning' : 'info', title: `${result.report.kind} reported by voice`, detail: 'Confirmed voice report. Saved to this trip only; not published to other drivers.', elapsedSeconds: trip.durationSeconds, speedMph: v.live.speed ?? 0, ...result.report.point });
      }
      return result;
    }, (active, text) => { if (alive.current) { setEnabled(active); latest.current.onStatus(text); } });
    conversation.current.start();
  }
  return <><Pressable accessibilityRole="switch" accessibilityLabel="Drive voice commands" accessibilityState={{ checked: enabled }} onPress={() => enabled ? conversation.current?.stop() : setNotice(true)} style={{ flex: .54, minWidth: 44, minHeight: 46, alignItems: 'center', justifyContent: 'center', borderRadius: 14, backgroundColor: enabled ? c.accent : c.surfaceMuted, borderWidth: 1, borderColor: enabled ? c.accent : c.borderStrong }}>
    <Ionicons name="sparkles-outline" size={22} color={enabled ? c.onAccent : c.textSecondary} />
  </Pressable><Modal visible={notice} transparent animationType="fade" onRequestClose={() => setNotice(false)}>
    <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,.55)', justifyContent: 'center', padding: 24 }}><View accessibilityViewIsModal style={{ backgroundColor: c.card, padding: 24, borderRadius: 24, gap: 16, maxWidth: 420, width: '100%', alignSelf: 'center' }}>
      <Text style={{ color: c.text, fontSize: 22, fontWeight: '700' }}>A short voice conversation</Text>
      <Text style={{ color: c.textSecondary, fontSize: 15, lineHeight: 22 }}>Set this up while parked. Ask about your next turn, score, family, or vehicle. CUBO speaks, then listens again for up to 60 seconds. Say “stop listening” to finish.</Text>
      <Text style={{ color: c.textSecondary, fontSize: 14, lineHeight: 21 }}>Your browser provider may process audio online. CUBO does not save these transcripts or audio. Replies may read personal details aloud. Confirmed hazards are saved to this trip only. No always-on “Hey Cubo” detection.</Text>
      <Pressable onPress={start} style={{ backgroundColor: c.accent, padding: 15, borderRadius: 14, alignItems: 'center' }}><Text style={{ color: c.onAccent, fontWeight: '700' }}>Agree & start listening</Text></Pressable>
      <Pressable onPress={() => setNotice(false)} style={{ padding: 12, alignItems: 'center' }}><Text style={{ color: c.textSecondary }}>Not now</Text></Pressable>
    </View></View>
  </Modal></>;
}
