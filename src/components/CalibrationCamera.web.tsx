import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { captureBrowserFrame } from '../features/calibration/captureBrowserFrame';

export type CalibrationCameraHandle = { captureFrame: () => Promise<void> };
type Props = { onReady: () => void; onUnavailable?: (message: string) => void };

/** Framing preview only: no face-recognition claim and no uploads or stored photos. */
export const CalibrationCamera = forwardRef<CalibrationCameraHandle, Props>(({ onReady, onUnavailable }, ref) => {
  const video = useRef<HTMLVideoElement>(null);
  const stream = useRef<MediaStream | null>(null);
  const generation = useRef(0);
  const callbacks = useRef({ onReady, onUnavailable });
  callbacks.current = { onReady, onUnavailable };
  const [status, setStatus] = useState<'idle' | 'starting' | 'live' | 'error'>('idle');
  const [message, setMessage] = useState('Allow the front camera to check your phone’s position.');
  const release = useCallback(() => {
    generation.current += 1;
    stream.current?.getTracks().forEach(track => { track.onended = null; track.stop(); });
    stream.current = null;
    if (video.current) { video.current.pause(); video.current.srcObject = null; }
  }, []);
  const unavailable = useCallback((text: string) => {
    release(); setStatus('error'); setMessage(text); callbacks.current.onUnavailable?.(text);
  }, [release]);
  useEffect(() => {
    const hidden = () => { if (document.hidden) unavailable('Camera paused while the app was in the background. Tap Enable camera to resume.'); };
    document.addEventListener('visibilitychange', hidden);
    return () => { document.removeEventListener('visibilitychange', hidden); release(); };
  }, [release, unavailable]);
  const start = async () => {
    if (status === 'starting') return;
    release();
    const request = generation.current;
    setStatus('starting'); setMessage('Approve camera access in your browser.');
    try {
      if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) throw new Error('Open CUBO using its HTTPS address in Safari to enable the camera.');
      const media = await navigator.mediaDevices.getUserMedia({ audio: false, video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } } });
      if (request !== generation.current) { media.getTracks().forEach(track => track.stop()); return; }
      stream.current = media;
      const element = video.current;
      if (!element) { release(); return; }
      media.getVideoTracks().forEach(track => { track.onended = () => unavailable('Camera disconnected. Tap Enable camera to reconnect.'); });
      element.srcObject = media;
      await element.play();
      if (request !== generation.current) return;
      // onPlaying is the readiness signal, not permission being granted alone.
    } catch (error) {
      if (request !== generation.current) return;
      const name = error instanceof Error ? error.name : '';
      unavailable(name === 'NotAllowedError' ? 'Camera access was denied. Allow Camera in Safari’s website settings, then try again.' : name === 'NotFoundError' ? 'No camera was found on this device.' : name === 'NotReadableError' ? 'The camera is in use. Close other camera apps and try again.' : error instanceof Error ? error.message : 'Camera could not start. Please try again.');
    }
  };
  useImperativeHandle(ref, () => ({ captureFrame: () => captureBrowserFrame(video.current, stream.current) }), []);
  return <View style={{ position: 'absolute', inset: 0 }}>
    <video ref={video} muted autoPlay playsInline onPlaying={() => { if (!stream.current) return; setStatus('live'); callbacks.current.onReady(); }} onError={() => unavailable('The video preview stopped. Please enable the camera again.')} style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }} />
    {status !== 'live' && <View style={{ position: 'absolute', inset: 0, alignItems: 'center', justifyContent: 'center', padding: 28, paddingBottom: 96, backgroundColor: '#090D0C' }}>
      <Text accessibilityRole={status === 'error' ? 'alert' : undefined} style={{ color: '#FFFFFF', fontFamily: 'Manrope_700Bold', fontSize: 16, textAlign: 'center', lineHeight: 24 }}>{message}</Text>
      <Pressable accessibilityRole="button" disabled={status === 'starting'} onPress={() => void start()} style={{ marginTop: 16, minHeight: 48, paddingHorizontal: 24, borderRadius: 16, backgroundColor: '#2F8F68', alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: '#FFFFFF', fontFamily: 'Manrope_700Bold' }}>{status === 'starting' ? 'Connecting…' : 'Enable camera'}</Text></Pressable>
    </View>}
  </View>;
});
