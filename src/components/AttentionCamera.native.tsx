import { CameraView, useCameraPermissions } from 'expo-camera';
import { File } from 'expo-file-system';
import { useEffect, useRef, useState } from 'react';
import { AppState, Pressable, StyleSheet, Text, View } from 'react-native';
import { WebView } from 'react-native-webview';
import type { AttentionCameraProps } from './AttentionCamera';
import { nativeDetectorHtml } from '../features/attention/nativeDetectorHtml';

export function AttentionCamera({ onSample, onStatus }: AttentionCameraProps) {
  const camera = useRef<CameraView>(null), worker = useRef<WebView>(null);
  const callbacks = useRef({ onSample, onStatus }); callbacks.current = { onSample, onStatus };
  const pending = useRef(false);
  const [permission, requestPermission] = useCameraPermissions();
  const [cameraReady, setCameraReady] = useState(false), [modelReady, setModelReady] = useState(false);
  const [pictureSize, setPictureSize] = useState<string>();
  const [foreground, setForeground] = useState(AppState.currentState === 'active');
  const [failed, setFailed] = useState(false), [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (!permission?.granted || modelReady || failed) return;
    const timer = setTimeout(() => { setFailed(true); callbacks.current.onStatus('Monitoring unavailable · model loading timed out; retry when connected'); }, 30000);
    return () => clearTimeout(timer);
  }, [permission?.granted, modelReady, failed, attempt]);
  useEffect(() => { const listener = AppState.addEventListener('change', state => { setForeground(state === 'active'); if (state !== 'active') { setCameraReady(false); callbacks.current.onStatus('Monitoring paused · app is in the background'); } }); return () => listener.remove(); }, []);
  useEffect(() => {
    if (!foreground || !cameraReady || !modelReady || failed) return;
    let active = true;
    const fail = () => { if (active) { setFailed(true); callbacks.current.onStatus('Monitoring unavailable · retry camera processing'); } };
    let pendingSince = 0;
    const interval = setInterval(() => {
      if (pending.current) { if (Date.now() - pendingSince > 5000) fail(); return; }
      if (!camera.current) return;
      pending.current = true;
      pendingSince = Date.now();
      const at = Date.now();
      void camera.current.takePictureAsync({ base64: true, quality: .15, shutterSound: false, skipProcessing: false }).then(photo => {
        // Delete only this exact camera-created temporary file, never user photos.
        if (photo?.uri) { try { new File(photo.uri).delete(); } catch { throw Error('Could not discard temporary frame'); } }
        if (!active) return;
        if (!photo?.base64) throw Error('Frame capture failed');
        worker.current?.injectJavaScript(`window.analyzeImage && window.analyzeImage(${JSON.stringify('data:image/jpeg;base64,' + photo.base64)}, ${at}); true;`);
      }).catch(() => { pending.current = false; fail(); });
    }, 400);
    return () => { active = false; clearInterval(interval); pending.current = false; };
  }, [foreground, cameraReady, modelReady, failed, attempt]);
  useEffect(() => {
    if (!permission?.granted) callbacks.current.onStatus('Monitoring unavailable · camera permission required');
    else callbacks.current.onStatus('Loading attention monitor…');
  }, [permission?.granted, attempt]);
  if (!permission?.granted) return <View style={s.permission}><Text style={s.text}>Camera access is required for monitoring.</Text><Pressable accessibilityRole="button" onPress={() => void requestPermission()} style={s.button}><Text style={s.text}>Allow camera</Text></Pressable></View>;
  return <View style={StyleSheet.absoluteFill}>
    {foreground ? <CameraView ref={camera} style={StyleSheet.absoluteFill} facing="front" pictureSize={pictureSize} onCameraReady={() => {
      setCameraReady(true);
      if (!pictureSize) void camera.current?.getAvailablePictureSizesAsync().then(sizes => {
        const area = (size: string) => size.split('x').map(Number).reduce((a, b) => a * b, 1);
        const supported = sizes.filter(size => /^\d+x\d+$/.test(size) && area(size) >= 640 * 480).sort((a, b) => area(a) - area(b));
        if (supported[0]) setPictureSize(supported[0]);
      }).catch(() => undefined);
    }} onMountError={() => { setFailed(true); callbacks.current.onStatus('Monitoring unavailable · camera could not start'); }} /> : null}
    <View pointerEvents="none" style={{ position: 'absolute', width: 1, height: 1, opacity: .01 }}><WebView key={attempt} ref={worker} source={{ html: nativeDetectorHtml }} javaScriptEnabled originWhitelist={['*']} onMessage={event => {
      try { const message = JSON.parse(event.nativeEvent.data); if (message.type === 'ready') setModelReady(true); else if (message.type === 'sample') { pending.current = false; if (foreground && !failed) callbacks.current.onSample(message.sample); } else { setFailed(true); callbacks.current.onStatus('Monitoring unavailable · model failed to load'); } } catch { setFailed(true); }
    }} onError={() => { setFailed(true); callbacks.current.onStatus('Monitoring unavailable · model could not load'); }} /></View>
    {failed ? <Pressable accessibilityRole="button" onPress={() => { pending.current = false; setFailed(false); setModelReady(false); setAttempt(v => v + 1); }} style={s.button}><Text style={s.text}>Retry monitoring</Text></Pressable> : null}
  </View>;
}
const s = StyleSheet.create({ permission: { position: 'absolute', top: 0, left: 0, bottom: 0, right: 0, justifyContent: 'center', padding: 12, backgroundColor: '#080A0D' }, text: { color: '#FFFFFF', textAlign: 'center', fontSize: 12 }, button: { minHeight: 44, padding: 12, backgroundColor: '#183F31', marginTop: 38 } });
