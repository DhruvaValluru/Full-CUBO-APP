import React, { Component, forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { AppState, Pressable, Text, View } from 'react-native';
import NativeMap, { type MapViewProps, type LatLng } from 'react-native-maps';
import { WebView } from 'react-native-webview';
import { nativeMapFallbackHtml } from './nativeMapFallbackHtml';
import { useMapSource } from '../features/maps/MapSourceContext';
export { Marker, Polyline, type Region } from 'react-native-maps';
export type DrivingMapHandle = Pick<NativeMap, 'animateCamera' | 'animateToRegion' | 'fitToCoordinates'> & { toggleSource: () => void };
type Pin = LatLng & { driver?: boolean; heading?: number; label?: string; title?: string; color?: string; symbol?: string };
type Props = MapViewProps & { active: boolean; fallbackData: { center: LatLng; route: LatLng[]; pins: Pin[]; mode: string; attributionBottom: number; preview?: boolean } };
class NativeMapBoundary extends Component<{ children: React.ReactNode; onFailure: () => void }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch() { this.props.onFailure(); }
  render() { return this.state.failed ? null : this.props.children; }
}
/** Switch only the renderer so an active trip, camera and route never restart. */
export default forwardRef<DrivingMapHandle, Props>(function NativeDrivingMap({ fallbackData, active, children, ...props }, ref) {
  const { source, revision, setSource, appleAvailable } = useMapSource();
  const native = useRef<NativeMap>(null), web = useRef<WebView>(null);
  const [backup, setBackup] = useState(source === 'web'), [ready, setReady] = useState(false);
  const [webError, setWebError] = useState(false), [attempt, setAttempt] = useState(0);
  const [foreground, setForeground] = useState(AppState.currentState === 'active');
  const loadedTimer = useRef(false);
  const bridgeReady = useRef(false), latestData = useRef(fallbackData);
  latestData.current = fallbackData;
  const lastCommand = useRef<Record<string, unknown> | null>(null);
  const pendingNative = useRef<((map: NativeMap) => void) | null>(null);
  const lastNativeAction = useRef<((map: NativeMap) => void) | null>(null);
  const fail = useCallback(() => setBackup(true), []);
  useEffect(() => {
    bridgeReady.current = false; loadedTimer.current = false;
    pendingNative.current = lastNativeAction.current;
    setReady(false); setWebError(false); setAttempt(value => value + 1); setBackup(source === 'web');
  }, [source, revision]);
  useEffect(() => {
    const subscription = AppState.addEventListener('change', state => setForeground(state === 'active'));
    return () => subscription.remove();
  }, []);
  const send = useCallback((message: unknown) => {
    if (!bridgeReady.current) return;
    // Encode as data; names/coordinates can never become executable script.
    const encoded = JSON.stringify(JSON.stringify(message)).replace(/</g, '\\u003c');
    web.current?.injectJavaScript(`window.cuboReceive(JSON.parse(${encoded}));true;`);
  }, []);
  useImperativeHandle(ref, () => {
    const run = (command: Record<string, unknown>, action: (map: NativeMap) => void) => {
      lastCommand.current = command;
      lastNativeAction.current = action;
      if (backup) send(command);
      else if (!ready) pendingNative.current = action;
      else { try { if (native.current) action(native.current); } catch { fail(); } }
    };
    return {
      toggleSource: () => setSource(backup && appleAvailable ? 'apple' : 'web'),
      animateCamera: (camera, options) => run({ kind: 'camera', value: camera, duration: options?.duration }, map => map.animateCamera(camera, options)),
      animateToRegion: (region, duration) => run({ kind: 'region', value: region, duration }, map => map.animateToRegion(region, duration)),
      fitToCoordinates: (points = [], options) => run({ kind: 'fit', value: points, padding: options?.edgePadding }, map => map.fitToCoordinates(points, options)),
    };
  }, [backup, ready, send, fail, appleAvailable, setSource]);
  useEffect(() => {
    if (backup || ready || !active || !foreground) return;
    const timer = setTimeout(() => { if (AppState.currentState === 'active') fail(); }, 20000);
    return () => clearTimeout(timer);
  }, [backup, ready, active, foreground, fail]);
  useEffect(() => {
    if (!backup && ready && active && foreground) {
      let live = true;
      let deadline: ReturnType<typeof setTimeout> | undefined;
      const check = () => {
        if (AppState.currentState !== 'active' || !native.current) return;
        deadline = setTimeout(() => { if (live && AppState.currentState === 'active') fail(); }, 8000);
        try {
          native.current.getCamera().then(() => clearTimeout(deadline), () => { clearTimeout(deadline); if (live) fail(); });
        } catch { clearTimeout(deadline); if (live) fail(); }
      };
      const timer = setInterval(check, 15000);
      return () => { live = false; clearInterval(timer); clearTimeout(deadline); };
    }
  }, [backup, ready, active, foreground, fail]);
  useEffect(() => { if (backup) send({ kind: 'state', value: fallbackData }); }, [backup, fallbackData, send]);
  useEffect(() => {
    if (!backup) return;
    const timer = setTimeout(() => { if (!loadedTimer.current) setWebError(true); }, 25000);
    return () => clearTimeout(timer);
  }, [backup, attempt]);
  if (!backup) return <NativeMapBoundary key={attempt} onFailure={fail}><NativeMap {...props} ref={native} onMapReady={event => {
    setReady(true); props.onMapReady?.(event);
    try { if (native.current) pendingNative.current?.(native.current); pendingNative.current = null; } catch { fail(); }
  }}>{children}</NativeMap></NativeMapBoundary>;
  return <View style={props.style}>
    <WebView key={attempt} ref={web} style={{ flex: 1, backgroundColor: '#12151b' }} source={{ html: nativeMapFallbackHtml }} originWhitelist={['*']} javaScriptEnabled scrollEnabled={false}
      geolocationEnabled={false} allowsInlineMediaPlayback={false} mixedContentMode="never"
      onShouldStartLoadWithRequest={request => request.url === 'about:blank' || request.url.startsWith('about:blank#')}
      onError={() => setWebError(true)} onHttpError={() => setWebError(true)} onContentProcessDidTerminate={() => setWebError(true)} onRenderProcessGone={() => setWebError(true)}
      onMessage={event => {
        let type: string; try { type = JSON.parse(event.nativeEvent.data).type; } catch { return; }
        if (type === 'bridge') { bridgeReady.current = true; send({ kind: 'state', value: latestData.current }); if (lastCommand.current) send(lastCommand.current); }
        if (type === 'ready') { loadedTimer.current = true; setWebError(false); props.onMapReady?.(); }
        if (type === 'error') setWebError(true);
        if (type === 'pan') props.onPanDrag?.({} as never);
        if (type === 'press') props.onPress?.({} as never);
      }} />
    {webError && <View style={{ position: 'absolute', top: '40%', left: 16, right: 16, padding: 16, borderRadius: 16, backgroundColor: fallbackData.mode === 'dark' ? '#202630' : '#fff' }}>
      <Text accessibilityRole="alert" style={{ color: fallbackData.mode === 'dark' ? '#F4F7F6' : '#162820', fontFamily: 'Manrope_500Medium' }}>Backup map unavailable. Check your internet connection.</Text>
      <Pressable accessibilityRole="button" onPress={() => { bridgeReady.current = false; loadedTimer.current = false; setWebError(false); setAttempt(n => n + 1); }} style={{ padding: 12, minHeight: 48 }}><Text style={{ color: fallbackData.mode === 'dark' ? '#80CBB0' : '#167655', fontFamily: 'Manrope_700Bold' }}>Retry backup map</Text></Pressable>
    </View>}
  </View>;
});
