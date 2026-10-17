import { useCallback, useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Platform, Text, Vibration, View } from 'react-native';
import { AttentionCamera } from './AttentionCamera';
import { advanceAttention, emptyAttention, type AttentionBaseline, type FaceSample } from '../features/attention/attentionPolicy';
import { readCalibration } from '../features/calibration/calibrationStatus';
import { useDrives } from '../features/drives/DriveContext';

export function DriveAttentionCamera({ speedMph, gpsValid }: { speedMph: number; gpsValid: boolean }) {
  const { activeSession, recordAttention, addEvent, setMonitoringStatus } = useDrives();
  const latest = useRef({ activeSession, speedMph, gpsValid }); latest.current = { activeSession, speedMph, gpsValid };
  const state = useRef(emptyAttention());
  const baseline = useRef<AttentionBaseline | null>(null);
  const lastFrame = useRef(Date.now());
  const [status, setStatus] = useState('Loading attention monitor…');
  useEffect(() => { setMonitoringStatus(status); }, [status, setMonitoringStatus]);
  useEffect(() => {
    let live = true;
    state.current = { ...emptyAttention(), measuredMs: latest.current.activeSession?.measuredMs ?? 0, attentiveMs: latest.current.activeSession?.attentiveMs ?? 0 };
    void readCalibration().then(value => { if (live) baseline.current = value?.baseline ?? null; }).catch(() => { if (live) setStatus('Calibration could not be read · monitoring unavailable'); });
    const timer = setInterval(() => { if (Date.now() - lastFrame.current > 3000) { state.current = { ...state.current, lastAt: 0, since: 0, emitted: false, kind: null }; setStatus('Monitoring unavailable · no fresh camera frames'); } }, 1000);
    return () => { live = false; clearInterval(timer); setMonitoringStatus('Monitoring paused · return to the drive screen'); };
  }, [activeSession?.id, setMonitoringStatus]);
  const onSample = useCallback((sample: FaceSample) => {
    const { activeSession: session, speedMph: speed, gpsValid: valid } = latest.current;
    if (!session || Date.now() - sample.at > 1500) return;
    lastFrame.current = Date.now();
    const result = advanceAttention(state.current, sample, baseline.current, speed >= 3, valid);
    const previous = state.current;
    state.current = result.state; setStatus(result.status);
    // Keep video-frame traffic out of the whole application render tree.
    if (Math.floor(result.state.measuredMs / 1000) !== Math.floor(previous.measuredMs / 1000)) recordAttention(result.state.measuredMs, result.state.attentiveMs);
    if (result.event) {
      const closed = result.event.kind === 'eyes_closed';
      addEvent({ type: result.event.kind, severity: 'warning', title: closed ? 'Prolonged eye closure' : 'Sustained head turn', detail: 'Experimental camera estimate; not a confirmed diagnosis or proof of distraction.', elapsedSeconds: session.durationSeconds, speedMph: speed, durationMs: result.event.duration });
      Vibration.vibrate([0, 250, 150, 250]);
      const message = closed ? 'Eyes closed. Pull over safely if tired.' : 'Keep your attention on the road.';
      AccessibilityInfo.announceForAccessibility(message);
      if (Platform.OS === 'web' && typeof window !== 'undefined' && 'speechSynthesis' in window && !window.speechSynthesis.speaking) window.speechSynthesis.speak(new SpeechSynthesisUtterance(message));
    }
  }, [recordAttention, addEvent]);
  return <View style={{ flex: 1 }}><AttentionCamera onSample={onSample} onStatus={setStatus} /><View pointerEvents="none" style={{ position: 'absolute', left: 3, right: 3, top: 38, backgroundColor: 'rgba(8,10,13,.85)', padding: 5, borderRadius: 6 }}><Text accessibilityLiveRegion="polite" style={{ color: '#FFFFFF', fontSize: 10 }}>{status}</Text></View></View>;
}
