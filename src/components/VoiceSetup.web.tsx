import { useEffect, useRef, useState } from 'react';
import { useAppearance } from '../theme/AppearanceContext';
import { MicrophoneMeter } from '../features/cuboAI/microphoneMeter';
import { accessError } from '../features/permissions/accessErrors';
import type { VoiceSetupProps } from './VoiceSetup';

export function VoiceSetup({ onContinue, onClose }: VoiceSetupProps) {
  const { colors: c } = useAppearance();
  const dialog = useRef<HTMLDialogElement>(null);
  const meter = useRef<MicrophoneMeter | null>(null);
  const alive = useRef(true);
  const attempt = useRef(0);
  const [level, setLevel] = useState(0);
  const [state, setState] = useState<'idle' | 'requesting' | 'testing' | 'stopped'>('idle');
  const [error, setError] = useState('');
  const [heard, setHeard] = useState(false);
  const stop = () => { attempt.current++; meter.current?.stop(); setLevel(0); setState('stopped'); };
  useEffect(() => {
    alive.current = true; dialog.current?.showModal();
    const hide = () => { if (document.hidden) stop(); };
    document.addEventListener('visibilitychange', hide);
    return () => { alive.current = false; attempt.current++; meter.current?.stop(); document.removeEventListener('visibilitychange', hide); };
  }, []);
  useEffect(() => { if (state !== 'testing') return; const timer = setTimeout(stop, 15000); return () => clearTimeout(timer); }, [state]);
  async function test() {
    const version = ++attempt.current;
    setError(''); setHeard(false); setState('requesting');
    const next = new MicrophoneMeter(); meter.current?.stop(); meter.current = next;
    try {
      const started = await next.start(value => { if (alive.current && version === attempt.current) { setLevel(value); if (value > .06) setHeard(true); } });
      if (alive.current && version === attempt.current && started) setState('testing');
    } catch (cause) {
      if (alive.current && version === attempt.current) { setState('stopped'); setError(accessError(cause)); }
    }
  }
  const leave = (callback: () => void) => { stop(); callback(); };
  const button = { minHeight: 48, borderRadius: 14, border: 'none', padding: '12px 16px', fontFamily: 'Manrope_700Bold, sans-serif', fontSize: 14, cursor: 'pointer' } as const;
  return <dialog ref={dialog} aria-labelledby="voice-check-title" onCancel={event => { event.preventDefault(); leave(onClose); }} style={{ width: 'calc(100% - 32px)', maxWidth: 400, maxHeight: 'calc(100dvh - 32px)', boxSizing: 'border-box', overflowY: 'auto', border: `1px solid ${c.border}`, borderRadius: 24, padding: 24, background: c.card, color: c.text, fontFamily: 'Manrope_400Regular, sans-serif' }}>
    <style>{`dialog::backdrop { background: rgba(8,18,14,.55); } .voice-check button:focus-visible { outline: 3px solid ${c.accent}; outline-offset: 3px; }`}</style>
    <div className="voice-check">
      <h2 id="voice-check-title" style={{ fontFamily: 'Manrope_800ExtraBold, sans-serif', fontSize: 22, margin: '0 0 12px', fontWeight: 'normal' }}>Check your microphone</h2>
      <p style={{ fontSize: 14, lineHeight: 1.6, margin: '0 0 24px', color: c.textSecondary }}>Optional · Try this while parked. Speak normally and watch the bar respond.</p>
      <div role="meter" aria-label="Microphone sound level" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(level * 100)} style={{ height: 12, borderRadius: 6, overflow: 'hidden', background: c.surfaceMuted }}><div style={{ width: `${level * 100}%`, height: '100%', background: c.accent }} /></div>
      <p role="status" style={{ fontSize: 14, minHeight: 24, margin: '12px 0 20px' }}>{state === 'requesting' ? 'Allow microphone access in your browser…' : state === 'testing' ? heard ? 'Sound detected · keep speaking' : 'Speak to test your microphone' : heard ? 'Test finished · sound was detected' : 'Microphone is off'}</p>
      {error && <p role="alert" style={{ color: c.text, fontSize: 14, lineHeight: 1.5 }}>{error}</p>}
      <button autoFocus style={{ ...button, width: '100%', background: c.accentSoft, color: c.accent }} onClick={state === 'testing' || state === 'requesting' ? stop : () => void test()}>{state === 'testing' || state === 'requesting' ? 'Stop microphone test' : 'Test microphone'}</button>
      <p style={{ fontSize: 12, lineHeight: 1.6, color: c.textSecondary, margin: '20px 0' }}>Test microphone requests browser access. Sound levels stay on this device; nothing is recorded or sent by this test. The microphone turns off when you continue. Manage access in Account → Preferences → Camera & microphone access. Voice assist has separate browser speech-recognition consent.</p>
      <button style={{ ...button, width: '100%', background: c.accent, color: c.onAccent }} onClick={() => leave(onContinue)}>{heard ? 'Continue to drive' : 'Skip & continue to drive'}</button>
      <button style={{ ...button, width: '100%', background: 'transparent', color: c.textSecondary, marginTop: 8 }} onClick={() => leave(onClose)}>Back to camera check</button>
    </div>
  </dialog>;
}
