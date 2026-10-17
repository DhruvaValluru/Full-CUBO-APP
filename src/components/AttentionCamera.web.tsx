import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { AttentionCameraProps } from './AttentionCamera';
import { faceMetrics } from '../features/attention/attentionPolicy';

export function AttentionCamera({ onSample, onStatus }: AttentionCameraProps) {
  const host = useRef<View>(null);
  const callbacks = useRef({ onSample, onStatus }); callbacks.current = { onSample, onStatus };
  const [attempt, setAttempt] = useState(0);
  const [error, setError] = useState(false);
  useEffect(() => {
    let cancelled = false, stream: MediaStream | undefined, detector: import('@mediapipe/tasks-vision').FaceLandmarker | undefined;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const video = document.createElement('video');
    video.muted = true; video.autoplay = true; video.playsInline = true;
    Object.assign(video.style, { width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' });
    const stop = () => { stream?.getTracks().forEach(track => track.stop()); video.srcObject = null; detector?.close(); detector = undefined; };
    const fail = () => { if (!cancelled) { setError(true); callbacks.current.onStatus('Monitoring unavailable · check camera access and connection, then retry'); } stop(); };
    setError(false); callbacks.current.onStatus('Loading attention monitor…');
    void (async () => {
      try {
        if (!navigator.mediaDevices?.getUserMedia) throw Error('Camera requires HTTPS');
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } }, audio: false });
        if (cancelled) { stop(); return; }
        video.srcObject = stream; (host.current as unknown as HTMLElement)?.appendChild(video); await video.play();
        const { FaceLandmarker, FilesetResolver } = await import('@mediapipe/tasks-vision');
        const files = await FilesetResolver.forVisionTasks('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm');
        if (cancelled) { stop(); return; }
        detector = await FaceLandmarker.createFromOptions(files, { baseOptions: { modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task', delegate: 'CPU' }, runningMode: 'VIDEO', numFaces: 1 });
        if (cancelled) { stop(); return; }
        let lastTime = -1;
        const tick = () => {
          if (cancelled) return;
          try {
            if (!document.hidden && video.readyState >= 2 && video.currentTime !== lastTime && stream?.getVideoTracks()[0]?.readyState === 'live') {
              lastTime = video.currentTime;
              const result = detector!.detectForVideo(video, performance.now());
              callbacks.current.onSample({ ...faceMetrics(result.faceLandmarks[0]), at: Date.now() });
            } else if (document.hidden) callbacks.current.onStatus('Monitoring paused · app is in the background');
            timer = setTimeout(tick, 200);
          } catch { fail(); }
        };
        tick();
      } catch { fail(); }
    })();
    return () => { cancelled = true; clearTimeout(timer); stop(); video.remove(); };
  }, [attempt]);
  return <View style={StyleSheet.absoluteFill}><View ref={host} style={StyleSheet.absoluteFill} />{error ? <Pressable accessibilityRole="button" accessibilityLabel="Retry attention monitoring" onPress={event => { event.stopPropagation(); setAttempt(v => v + 1); }} style={{ marginTop: 40, padding: 12, backgroundColor: '#183F31' }}><Text style={{ color: '#FFFFFF', textAlign: 'center' }}>Retry monitoring</Text></Pressable> : null}</View>;
}
