import { useEffect, useRef, useState } from 'react';
import { AppState, Pressable, Text, View } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAppearance } from '../theme/AppearanceContext';
import { useDrives } from '../features/drives/DriveContext';
import { accessHelp, checkMediaAccess, requestMediaAccess, openAccessSettings, type MediaKind } from '../features/permissions/mediaAccess';
import { accessError } from '../features/permissions/accessErrors';

export function MediaAccessPreference() {
  const { colors: c } = useAppearance(); const focused = useIsFocused(); const { activeSession } = useDrives();
  const [open, setOpen] = useState(false); const [busy, setBusy] = useState<MediaKind | null>(null);
  const [status, setStatus] = useState({ camera: 'Not checked', microphone: 'Not checked', location: 'Not checked' });
  const [error, setError] = useState(''); const epoch = useRef(0);
  const pending = useRef<AbortController | null>(null);
  useEffect(() => {
    const version = ++epoch.current;
    pending.current?.abort(); pending.current = null; setBusy(null);
    if (open && focused) void Promise.all([checkMediaAccess('camera'), checkMediaAccess('microphone'), checkMediaAccess('location')]).then(([camera, microphone, location]) => { if (version === epoch.current) setStatus({ camera, microphone, location }); }).catch(() => {});
    const subscription = AppState.addEventListener('change', state => {
      if (state === 'background') { epoch.current++; pending.current?.abort(); pending.current = null; setBusy(null); }
      if (state === 'active' && open && focused && !pending.current) {
        const check = epoch.current;
        void Promise.all([checkMediaAccess('camera'), checkMediaAccess('microphone'), checkMediaAccess('location')]).then(([camera, microphone, location]) => { if (check === epoch.current) setStatus({ camera, microphone, location }); }).catch(() => {});
      }
    });
    return () => { epoch.current++; pending.current?.abort(); pending.current = null; subscription.remove(); };
  }, [open, focused]);
  async function allow(kind: MediaKind) {
    if (pending.current || busy || activeSession || !focused) return;
    const version = ++epoch.current; const request = new AbortController(); pending.current = request; setBusy(kind); setError('');
    try {
      const value = await requestMediaAccess(kind, request.signal);
      if (version === epoch.current) setStatus(current => ({ ...current, [kind]: value }));
    } catch (cause) { if (version === epoch.current) { setError(accessError(cause)); setStatus(current => ({ ...current, [kind]: 'Not granted · review message' })); } }
    finally { if (pending.current === request) pending.current = null; if (version === epoch.current) setBusy(null); }
  }
  return <View style={{ borderTopWidth: 1, borderColor: c.border }}>
    <Pressable accessibilityRole="button" accessibilityState={{ expanded: open }} onPress={() => setOpen(value => !value)} style={{ minHeight: 60, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      <Ionicons name="videocam-outline" size={20} color={c.textSecondary} /><Text style={{ flex: 1, color: c.text, fontSize: 14, fontFamily: 'Manrope_600SemiBold' }}>Camera, microphone & location</Text><Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={17} color={c.textSecondary} />
    </Pressable>
    {open ? <View style={{ gap: 12, paddingBottom: 16 }}>
      <Text style={{ fontSize: 12, lineHeight: 18, color: c.textSecondary }}>Permission only—not camera calibration or an always-on switch. On web, each check briefly uses the selected device, then stops. The location check discards your position; CUBO does not save or upload it.</Text>
      {(['camera', 'microphone', 'location'] as const).map(kind => <View key={kind} style={{ gap: 8 }}>
        <Text accessibilityLiveRegion="polite" style={{ color: c.text, fontSize: 13 }}>{kind === 'camera' ? 'Camera' : kind === 'location' ? 'Location' : 'Microphone'} · {status[kind]}</Text>
        <Pressable accessibilityRole="button" accessibilityState={{ disabled: !!busy || !!activeSession }} disabled={!!busy || !!activeSession} onPress={() => void allow(kind)} style={{ minHeight: 44, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 12, backgroundColor: c.accentSoft, borderRadius: 12, opacity: busy || activeSession ? .55 : 1 }}><Text style={{ color: c.accent, fontFamily: 'Manrope_600SemiBold', fontSize: 13 }}>{busy === kind ? 'Checking access… allow if prompted' : `Allow ${kind} access`}</Text></Pressable>
      </View>)}
      {busy ? <Pressable accessibilityRole="button" onPress={() => { epoch.current++; pending.current?.abort(); pending.current = null; setBusy(null); setError('Check cancelled. If you later approve a pending browser prompt, the device is immediately released.'); }} style={{ minHeight: 44, justifyContent: 'center' }}><Text style={{ color: c.accent }}>Cancel check</Text></Pressable> : null}
      {activeSession ? <Text style={{ color: c.textSecondary, fontSize: 12 }}>End your drive before changing access.</Text> : null}
      {!!error && <Text accessibilityRole="alert" style={{ color: c.text, fontSize: 12, lineHeight: 18 }}>{error}</Text>}
      <Text style={{ color: c.textSecondary, fontSize: 12, lineHeight: 18 }}>{accessHelp}</Text>
      {openAccessSettings ? <Pressable accessibilityRole="button" onPress={() => void openAccessSettings?.().catch(cause => setError(accessError(cause)))} style={{ minHeight: 44, justifyContent: 'center' }}><Text style={{ color: c.accent, fontSize: 13 }}>Open device settings</Text></Pressable> : null}
    </View> : null}
  </View>;
}
