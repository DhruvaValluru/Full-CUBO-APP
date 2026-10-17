import { useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../features/auth/AuthContext';
import { useAppearance } from '../theme/AppearanceContext';
import { readVoicePreference, writeVoicePreference, voicePreferenceKey } from '../features/cuboAI/voicePreference';

export function VoicePreference() {
  const { user } = useAuth();
  return user ? <VoiceChoice key={user.uid} uid={user.uid} /> : null;
}
function VoiceChoice({ uid }: { uid: string }) {
  const { colors: c } = useAppearance();
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [value, setValue] = useState('');
  const [error, setError] = useState('');
  const supported = typeof window !== 'undefined' && 'speechSynthesis' in window;
  useEffect(() => {
    try { setValue(readVoicePreference(localStorage, uid)); } catch { setError('Browser storage is unavailable. The default voice will be used.'); }
    if (!supported) return;
    const synth = window.speechSynthesis;
    const refresh = () => setVoices([...new Map(synth.getVoices().map(v => [v.voiceURI, v])).values()].sort((a, b) => a.lang.localeCompare(b.lang) || a.name.localeCompare(b.name)));
    const sync = (event: StorageEvent) => { if (event.key === voicePreferenceKey(uid) || event.key === null) setValue(readVoicePreference(localStorage, uid)); };
    refresh(); synth.addEventListener('voiceschanged', refresh); window.addEventListener('storage', sync);
    return () => { synth.removeEventListener('voiceschanged', refresh); window.removeEventListener('storage', sync); };
  }, [uid, supported]);
  const missing = value !== '' && !voices.some(v => v.voiceURI === value);
  return <div style={{ borderTop: `1px solid ${c.border}`, paddingBottom: 12 }}>
    <label style={{ minHeight: 60, display: 'flex', alignItems: 'center', gap: 12 }}>
      <Ionicons name="volume-medium-outline" size={20} color={c.textSecondary} />
      <span style={{ flex: 1, color: c.text, fontFamily: 'Manrope_600SemiBold', fontSize: 14 }}>CuboAI voice</span>
      <select aria-label="CuboAI voice" aria-describedby="cubo-voice-help" disabled={!supported} value={value} onChange={event => {
        try { writeVoicePreference(localStorage, uid, event.target.value); setValue(event.target.value); setError(''); window.speechSynthesis.cancel(); }
        catch { setError('Your voice choice could not be saved. Please try again.'); }
      }} style={{ minHeight: 44, minWidth: 0, maxWidth: '55%', padding: 8, borderRadius: 8, border: `1px solid ${c.borderStrong}`, background: c.card, color: c.text, fontFamily: 'Manrope_600SemiBold', fontSize: 16 }}>
        <option value="">Default (English)</option>
        {missing && <option value={value}>Saved voice unavailable</option>}
        {voices.map(v => <option key={v.voiceURI} value={v.voiceURI}>{v.name} · {v.lang}</option>)}
      </select>
    </label>
    <p id="cubo-voice-help" style={{ margin: '0 0 0 32px', fontSize: 12, lineHeight: '18px', color: c.textSecondary, fontFamily: 'Manrope_400Regular' }}>{!supported ? 'Read-aloud is not supported by this browser.' : missing ? 'The saved voice is unavailable here. Listen will use the default voice.' : voices.length ? 'Used by Listen in CuboAI. Saved for this account on this browser.' : 'Only the default voice is available right now. More voices may appear when the browser loads them.'}</p>
    {error && <p role="alert" style={{ color: c.text, fontSize: 12 }}>{error}</p>}
  </div>;
}
