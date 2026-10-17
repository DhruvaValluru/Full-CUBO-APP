import { useEffect, useRef, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { useAuth } from '../features/auth/AuthContext';
import { useDrives } from '../features/drives/DriveContext';
import { useAppearance } from '../theme/AppearanceContext';
import { CuboAISession } from '../features/cuboAI/session';
import { CuboAIVoice } from '../features/cuboAI/browserVoice';
import { createWorkerFactory } from '../features/cuboAI/workerClient';
import { accountKey, readState, type LocalAIState } from '../features/cuboAI/localState';
import { drivingContext, usageBadge } from '../features/cuboAI/presentation';
import { startupKeys, startupState } from '../features/cuboAI/startup';

const MODEL = 'Llama-3.2-1B-Instruct-q4f32_1-MLC';
type Props = NativeStackScreenProps<RootStackParamList, 'CuboAI'>;
export function CuboAIScreen(props: Props) {
  const { user } = useAuth();
  return user ? <Chat key={user.uid} {...props} uid={user.uid} /> : null;
}
function Chat({ navigation, uid }: Props & { uid: string }) {
  const { colors: c } = useAppearance();
  const { user } = useAuth(); const { activeSession, sessions } = useDrives();
  const latest = useRef({ uid: user?.uid, driving: !!activeSession, sessions }); latest.current = { uid: user?.uid, driving: !!activeSession, sessions };
  const session = useRef<CuboAISession | null>(null); const voice = useRef<CuboAIVoice | null>(null);
  const alive = useRef(true); const epoch = useRef(0); const end = useRef<HTMLDivElement>(null);
  const [data, setData] = useState<LocalAIState | null>(null);
  const [notice, setNotice] = useState(true); const [dontShow, setDontShow] = useState(false);
  const [draft, setDraft] = useState(''); const [source, setSource] = useState<'text' | 'voice'>('text');
  const [phase, setPhase] = useState<'idle' | 'loading' | 'ready' | 'thinking'>('idle');
  const [progress, setProgress] = useState(0); const [error, setError] = useState('');
  const [loadStatus, setLoadStatus] = useState('');
  const [configured, setConfigured] = useState(false);
  const [visible, setVisible] = useState(!document.hidden);
  const autoAttempted = useRef(false);
  const modelKeys = startupKeys(uid, MODEL);
  const [listening, setListening] = useState(false); const [voiceConsent, setVoiceConsent] = useState(false);
  const [settings, setSettings] = useState(false); const [notes, setNotes] = useState(''); const [clear, setClear] = useState(false);
  const noticeKey = accountKey(uid) + ':notice-v1';
  const recoveryKey = accountKey(uid) + ':interrupted';
  const allowed = () => alive.current && latest.current.uid === uid && !latest.current.driving && !document.hidden;
  const refresh = () => { if (alive.current && latest.current.uid === uid) setData(readState(window.localStorage, uid)); };
  function makeSession() {
    const runtime = createWorkerFactory(MODEL);
    return new CuboAISession({ uid, currentUid: () => latest.current.uid ?? null, isDriving: () => latest.current.driving,
      store: window.localStorage, appContext: () => drivingContext(latest.current.sessions),
      loadModel: runtime.load, cancelLoad: runtime.stop });
  }
  const report = (cause: unknown) => { if (alive.current) setError(cause instanceof Error ? cause.message : 'CuboAI could not finish. Please try again.'); };
  useEffect(() => {
    alive.current = true;
    try {
      const startup = startupState(localStorage, uid, MODEL);
      setConfigured(startup.configured);
      if (startup.interruptedLoad) {
        autoAttempted.current = true;
        setError('Model preparation was interrupted. Tap Start to retry; automatic retry is paused to avoid a restart loop.');
      }
    } catch (cause) { report(cause); }
    try { session.current = makeSession(); refresh(); setNotice(localStorage.getItem(noticeKey) !== 'hidden'); }
    catch (cause) { report(cause); }
    try {
      const interrupted = localStorage.getItem(recoveryKey);
      if (interrupted) { setDraft(interrupted.slice(0, 1000)); setError('Your previous reply was interrupted. Your question is restored; it has not been sent again.'); }
    } catch (cause) { report(cause); }
    voice.current = new CuboAIVoice(allowed);
    const suspend = () => { setVisible(!document.hidden); if (!document.hidden) { autoAttempted.current = false; return; } epoch.current++; voice.current?.stop(); setListening(false); void session.current?.dispose().catch(() => {}); session.current = null; try { localStorage.removeItem(modelKeys.loading); } catch {} setPhase('idle'); };
    const sync = () => { try { refresh(); } catch (cause) { report(cause); } };
    document.addEventListener('visibilitychange', suspend); window.addEventListener('storage', sync);
    const timer = setInterval(sync, 30000);
    return () => { alive.current = false; epoch.current++; clearInterval(timer); document.removeEventListener('visibilitychange', suspend); window.removeEventListener('storage', sync); voice.current?.dispose(); void session.current?.dispose().catch(() => {}); try { localStorage.removeItem(modelKeys.loading); } catch {} };
  }, [uid]);
  useEffect(() => { if (activeSession) { epoch.current++; voice.current?.stop(); setListening(false); void session.current?.dispose().catch(() => {}); session.current = null; setPhase('idle'); } }, [activeSession?.id]);
  useEffect(() => { end.current?.scrollIntoView({ block: 'end', behavior: 'auto' }); }, [data?.messages.length, phase]);
  const badge = usageBadge(data?.used ?? 0); const exhausted = badge.percent === 0;
  const blocked = notice || !!activeSession || !data || exhausted;
  useEffect(() => {
    if (!configured || blocked || !visible || phase !== 'idle' || autoAttempted.current) return;
    autoAttempted.current = true;
    void load();
  }, [configured, blocked, visible, phase]);
  async function load() {
    if (blocked || !allowed() || phase === 'loading') return;
    const version = epoch.current; setError(''); setPhase('loading'); setProgress(0);
    autoAttempted.current = true;
    try {
      localStorage.setItem(modelKeys.loading, 'yes');
      session.current ??= makeSession();
      await session.current.prepare(true, (amount, status) => { if (allowed() && epoch.current === version) { setProgress(Math.round(amount * 100)); setLoadStatus(status); } });
      if (allowed() && epoch.current === version) {
        localStorage.setItem(modelKeys.ready, 'yes'); localStorage.removeItem(modelKeys.loading);
        setConfigured(true); setPhase('ready'); refresh();
      }
    } catch (cause) { if (allowed() && epoch.current === version) { try { localStorage.removeItem(modelKeys.loading); } catch {} report(cause); void session.current?.dispose(); session.current = null; setPhase('idle'); } }
  }
  async function send() {
    if (blocked || phase !== 'ready' || !draft.trim()) return;
    const text = draft; const version = epoch.current; setError(''); setPhase('thinking'); voice.current?.stop(); setListening(false);
    try { localStorage.setItem(recoveryKey, text); await session.current!.send(text, source); if (allowed() && version === epoch.current) { localStorage.removeItem(recoveryKey); setDraft(''); setSource('text'); setPhase('ready'); refresh(); } }
    catch (cause) { if (allowed() && version === epoch.current) { report(cause); void session.current?.dispose(); session.current = null; setPhase('idle'); } }
    finally { if (allowed() && version === epoch.current) { try { refresh(); } catch (cause) { report(cause); } } }
  }
  function listen() {
    if (blocked || phase !== 'ready') return;
    if (listening) { voice.current?.stop(); setListening(false); return; }
    if (!voiceConsent) { setVoiceConsent(true); return; }
    startListening();
  }
  function startListening() {
    setVoiceConsent(false); setError('');
    try { voice.current?.listen(true, text => { if (allowed()) { setDraft(text); setSource('voice'); setListening(false); } }, message => { if (allowed()) { setError(message); setListening(false); } }, () => { if (alive.current) setListening(false); }); setListening(true); }
    catch (cause) { report(cause); setListening(false); }
  }
  function acknowledge() {
    try { if (dontShow) localStorage.setItem(noticeKey, 'hidden'); setNotice(false); } catch (cause) { report(cause); }
  }
  const icon = (name: React.ComponentProps<typeof Ionicons>['name'], color = c.text) => <Ionicons name={name} size={22} color={color} />;
  return <div className="cubo-ai" style={{ '--ai-bg': c.background, '--ai-card': c.card, '--ai-text': c.text, '--ai-muted': c.textSecondary, '--ai-border': c.borderStrong, '--ai-accent': c.accent, '--ai-soft': c.accentSoft, '--ai-on': c.onAccent } as React.CSSProperties}>
    <style>{CSS}</style>
    <header className="ai-header"><button aria-label="Back to Home" className="ai-icon" onClick={() => navigation.goBack()}>{icon('arrow-back')}</button><div className="ai-heading"><h1>CuboAI</h1><p>Your drive, understood.</p></div><div className="ai-allowance" title="Local weekly allowance · resets Monday 00:00 UTC"><span className="ai-percent" style={{ background: badge.background, color: badge.foreground }} aria-label={`${badge.percent}% weekly allowance remaining`}>{badge.percent}%</span><small>remaining</small></div><button aria-label="CuboAI settings" className="ai-icon" onClick={() => { setNotes(data?.memory ?? ''); setSettings(true); }}>{icon('ellipsis-horizontal')}</button></header>
    <main className="ai-thread" role="log" aria-live="polite" aria-relevant="additions text" aria-label="Conversation">
      {!data?.messages.length && <div className="ai-welcome"><Ionicons name="chatbubble-ellipses-outline" size={40} color={c.accent} /><h2>A little clarity<br />for your next drive.</h2><p>Ask about your recorded focus score, explore CUBO, or bring another question.</p><div className="ai-prompts">{['Explain my focus score', 'How does camera calibration work?', 'How can I build better driving habits?'].map(text => <button key={text} disabled={blocked} onClick={() => { setDraft(text); setSource('text'); }}>{text}{icon('arrow-up-outline', c.accent)}</button>)}</div></div>}
      {data?.messages.map((message, index) => <article key={`${message.at}-${index}`} className={`ai-message ai-${message.role}`}><small>{message.role === 'user' ? message.source === 'voice' ? 'You · voice' : 'You' : 'CuboAI'}</small><p>{message.content}</p>{message.role === 'assistant' && <button className="ai-read" aria-label="Read reply aloud" onClick={() => { try { voice.current?.speak(message.content); } catch (cause) { report(cause); } }}>{icon('volume-medium-outline', c.accent)}<span>Listen</span></button>}</article>)}
      {phase === 'thinking' && <p role="status" className="ai-status">CuboAI is thinking…</p>}
      <div ref={end} />
    </main>
    <footer className="ai-footer">
      {activeSession && <p role="status">End your drive before using CuboAI. Stay focused on the road.</p>}
      {error && <p role="alert" className="ai-error">{error}</p>}
      {!blocked && phase === 'idle' && <div className="ai-load"><p>Runs on this device. Model files are reused from this site’s browser cache when available. Starting reloads them into memory, not necessarily from the internet. Safari may evict cached files.</p><button className="ai-primary" onClick={() => void load()}>Start CuboAI</button></div>}
      {phase === 'loading' && <div role="status" className="ai-loading"><span>Preparing CuboAI · {progress}%</span><progress max="100" value={progress} /><small>{loadStatus || 'Checking saved model files…'}</small></div>}
      {exhausted && <p role="status">Your weekly allowance is used. Resets {data ? new Date(data.week + 604800000).toLocaleString() : 'Monday'}.</p>}
      <div className="ai-composer"><textarea aria-label="Message CuboAI" rows={2} maxLength={2000} disabled={blocked || phase !== 'ready'} placeholder={exhausted ? 'Weekly usage done' : activeSession ? 'Available after your drive' : phase !== 'ready' ? 'Load CuboAI to start chatting' : 'Ask CuboAI anything…'} value={draft} onChange={e => { setDraft(e.target.value); setSource('text'); }} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); void send(); } }} /><div className="ai-compose-actions"><button className="ai-icon" aria-label={listening ? 'Stop listening' : 'Use voice input'} aria-pressed={listening} disabled={blocked || phase !== 'ready'} onClick={listen}>{icon(listening ? 'stop-circle' : 'mic-outline', listening ? c.danger : c.accent)}</button><button className="ai-send" aria-label="Send message" disabled={blocked || phase !== 'ready' || !draft.trim()} onClick={() => void send()}>{icon('arrow-up', c.onAccent)}</button></div></div>
      <small className="ai-caption">{listening ? 'Listening… tap stop when finished. Review your words before sending.' : 'AI can be wrong. Local history · not a safety assessment.'}</small>
      <a className="ai-credit" href="/licenses/llama-3.2.txt" target="_blank" rel="noreferrer">Built with Llama · License</a>
    </footer>
    {notice && <div className="ai-scrim"><section className="ai-dialog" role="dialog" aria-modal="true" aria-labelledby="ai-notice-title"><h2 id="ai-notice-title">Before you chat</h2>{error && <p role="alert" className="ai-error">{error}</p>}<p>CuboAI is experimental and can make mistakes. It cannot certify safe driving, provide emergency help, or guarantee insurance savings. Only use it while parked.</p><p>Your messages and saved notes stay in this browser, under your account. Clearing browser data can erase them. Your own saved trip summaries are provided to the model; camera frames and precise routes are not.</p><p>100 attempts per week. Failed attempts count. Voice input may use your browser provider’s servers and asks separately.</p><label className="ai-check"><input type="checkbox" checked={dontShow} onChange={e => setDontShow(e.target.checked)} />Don’t show me this again on this browser</label><button autoFocus className="ai-primary" onClick={acknowledge}>Continue to CuboAI</button><button className="ai-secondary" onClick={() => navigation.goBack()}>Go back</button></section></div>}
    {voiceConsent && <div className="ai-scrim"><section className="ai-dialog" role="dialog" aria-modal="true" aria-labelledby="ai-voice-title"><h2 id="ai-voice-title">Talk to CuboAI</h2><p>Your browser may send audio to its speech-recognition provider. CUBO does not save raw audio. You can review the transcript before sending.</p><button autoFocus className="ai-primary" onClick={startListening}>Allow voice for this message</button><button className="ai-secondary" onClick={() => setVoiceConsent(false)}>Keep typing</button></section></div>}
    {settings && <div className="ai-scrim"><section className="ai-dialog" role="dialog" aria-modal="true" aria-labelledby="ai-settings-title"><h2 id="ai-settings-title">Your CuboAI</h2>{error && <p role="alert" className="ai-error">{error}</p>}<p>Local history: latest 200 messages. No cross-device sync. The weekly allowance resets Monday at 00:00 UTC; history and notes stay.</p><label>Notes you want CuboAI to remember<textarea aria-label="Saved memory notes" rows={3} maxLength={2000} value={notes} onChange={e => setNotes(e.target.value)} /></label><button className="ai-primary" onClick={() => { try { session.current ??= makeSession(); session.current.remember(notes); refresh(); setSettings(false); } catch (cause) { report(cause); } }}>Save notes</button><button className="ai-secondary" onClick={() => { setSettings(false); setNotice(true); }}>Show safety notice</button><button className="ai-secondary" onClick={() => setClear(true)}>Clear history and notes</button>{clear && <><p>This deletes this account’s local chats and notes. Your weekly allowance will not reset. If it cannot be recovered from corrupt data, chat stays unavailable until next Monday.</p><button className="ai-secondary" onClick={() => { try { session.current ??= makeSession(); session.current.clearHistory(); localStorage.removeItem(recoveryKey); setDraft(''); setError(''); refresh(); setClear(false); setSettings(false); } catch (cause) { report(cause); } }}>Yes, clear them</button></>}<button autoFocus className="ai-secondary" onClick={() => { setSettings(false); setClear(false); }}>Close</button></section></div>}
    {(notice || voiceConsent || settings) && <ModalKeys returnTo={settings ? '[aria-label="CuboAI settings"]' : voiceConsent ? '[aria-label="Use voice input"]' : '.ai-load button'} close={() => { if (notice) navigation.goBack(); else { setSettings(false); setVoiceConsent(false); } }} />}
  </div>;
}
function ModalKeys({ close, returnTo }: { close: () => void; returnTo: string }) {
  useEffect(() => {
    return () => {
      queueMicrotask(() => {
        if (document.querySelector('.ai-dialog')) return;
        const target = document.querySelector<HTMLElement>(returnTo + ':not(:disabled)')
          ?? document.querySelector<HTMLElement>('.ai-composer textarea:not(:disabled)')
          ?? document.querySelector<HTMLElement>('.ai-header button');
        target?.focus();
      });
    };
  }, [returnTo]);
  useEffect(() => { const handler = (event: KeyboardEvent) => {
    if (event.key === 'Escape') { event.preventDefault(); close(); }
    if (event.key === 'Tab') { const items = Array.from(document.querySelectorAll<HTMLElement>('.ai-dialog button, .ai-dialog input, .ai-dialog textarea')).filter(el => !el.hasAttribute('disabled')); const first = items[0], last = items[items.length - 1]; if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); } else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); } }
  }; document.addEventListener('keydown', handler); return () => document.removeEventListener('keydown', handler); }, [close]); return null;
}
const CSS = `
.cubo-ai{position:relative;height:100%;min-height:0;display:flex;flex-direction:column;background:var(--ai-bg);color:var(--ai-text);font-family:Manrope_400Regular,sans-serif;overflow:hidden}.cubo-ai *{box-sizing:border-box}.cubo-ai button,.cubo-ai textarea,.cubo-ai input{font:inherit}.cubo-ai button{cursor:pointer}.cubo-ai button:disabled{opacity:.45;cursor:default}.cubo-ai button:focus-visible,.cubo-ai textarea:focus-visible,.cubo-ai a:focus-visible{outline:2px solid var(--ai-accent);outline-offset:3px}.cubo-ai button{border:0}.ai-header{display:flex;align-items:center;gap:8px;padding:16px 12px;border-bottom:1px solid var(--ai-border);padding-top:max(16px,env(safe-area-inset-top))}.ai-heading{flex:1;min-width:0}.ai-heading h1{font:24px Manrope_800ExtraBold;margin:0}.ai-heading p{font-size:12px;color:var(--ai-muted);margin:4px 0 0}.ai-icon{width:44px;height:44px;display:flex;align-items:center;justify-content:center;background:transparent;border-radius:50%;flex-shrink:0}.ai-percent{width:52px;height:52px;border-radius:50%;display:flex;align-items:center;justify-content:center;font:14px Manrope_800ExtraBold;font-variant-numeric:tabular-nums}.ai-allowance{display:flex;flex-direction:column;align-items:center;gap:4px}.ai-allowance small{font-size:10px;color:var(--ai-muted)}.ai-thread{flex:1;overflow-y:auto;min-height:0;padding:24px 20px;overscroll-behavior:contain}.ai-welcome{padding:24px 4px}.ai-welcome h2{font:28px/1.25 Manrope_800ExtraBold;margin:20px 0 12px}.ai-welcome p,.ai-dialog p{font-size:14px;line-height:1.65;color:var(--ai-muted)}.ai-prompts{display:grid;gap:8px;margin-top:28px}.ai-prompts button{display:flex;align-items:center;justify-content:space-between;text-align:left;gap:16px;min-height:52px;padding:12px 16px;background:var(--ai-card);border:1px solid var(--ai-border);border-radius:16px;color:var(--ai-text);font-size:14px}.ai-message{margin:0 0 24px;max-width:92%;overflow-wrap:anywhere}.ai-message small{font:12px Manrope_700Bold;color:var(--ai-muted)}.ai-message p{white-space:pre-wrap;font-size:15px;line-height:1.7;margin:8px 0}.ai-user{margin-left:auto;border-radius:20px 20px 4px 20px;background:var(--ai-soft);padding:12px 16px}.ai-assistant{margin-right:auto;padding:4px 0}.ai-read{display:flex;align-items:center;gap:8px;min-height:44px;background:none;color:var(--ai-accent);font-size:12px}.ai-footer{padding:12px 16px max(12px,env(safe-area-inset-bottom));border-top:1px solid var(--ai-border);background:var(--ai-bg)}.ai-footer p{font-size:12px;line-height:1.5;margin:0 0 8px}.ai-composer{display:flex;align-items:flex-end;gap:4px;border:1px solid var(--ai-border);border-radius:20px;background:var(--ai-card);padding:8px}.ai-composer textarea{flex:1;min-width:0;border:0;background:none;color:var(--ai-text);padding:8px;font-size:16px;line-height:1.5;resize:none;max-height:120px}.ai-composer textarea::placeholder{color:var(--ai-muted)}.ai-compose-actions{display:flex;align-items:center}.ai-send{width:44px;height:44px;border-radius:50%;background:var(--ai-accent);display:flex;align-items:center;justify-content:center}.ai-caption{display:block;font-size:10px;text-align:center;color:var(--ai-muted);margin-top:8px}.ai-credit{display:block;text-align:center;color:var(--ai-muted);font-size:10px;margin-top:6px;text-underline-offset:3px}.ai-primary,.ai-secondary{width:100%;min-height:48px;border-radius:14px;padding:12px 16px;font-family:Manrope_700Bold!important}.ai-primary{background:var(--ai-accent);color:var(--ai-on)}.ai-secondary{background:var(--ai-soft);color:var(--ai-text);margin-top:8px}.ai-load{margin-bottom:12px}.ai-load p{color:var(--ai-muted)}.ai-loading{display:grid;gap:8px;font-size:12px;padding-bottom:12px}.ai-loading progress{width:100%;accent-color:var(--ai-accent)}.ai-error{color:var(--ai-text);border:1px solid #BD2929;border-radius:12px;padding:8px}.ai-status{font-size:14px;color:var(--ai-muted)}.ai-scrim{position:absolute;inset:0;z-index:10;background:rgba(0,0,0,.6);display:flex;align-items:center;justify-content:center;padding:20px}.ai-dialog{background:var(--ai-card);color:var(--ai-text);border-radius:24px;padding:24px;width:100%;max-width:440px;max-height:90%;overflow:auto;box-shadow:0 12px 40px rgba(0,0,0,.2)}.ai-dialog h2{font:24px Manrope_800ExtraBold;margin:0 0 16px}.ai-dialog label{font-size:14px}.ai-check{display:flex;align-items:center;gap:12px;min-height:48px;margin:16px 0}.ai-check input{width:20px;height:20px;accent-color:var(--ai-accent)}.ai-dialog textarea{width:100%;margin:8px 0 16px;border-radius:12px;border:1px solid var(--ai-border);background:var(--ai-bg);color:var(--ai-text);padding:12px;resize:vertical;font-size:16px}@media(max-width:360px){.ai-header{gap:4px;padding-left:8px;padding-right:8px}.ai-heading p{font-size:10px}.ai-thread{padding:16px}.ai-dialog{padding:20px}.ai-compose-actions{gap:0}}`;
