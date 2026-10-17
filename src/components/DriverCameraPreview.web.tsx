import { useCallback } from 'react';
import { Pressable, Text, View, type View as RNView } from 'react-native';
import { useWebFaceLandmarks } from '../hooks/useWebFaceLandmarks';

type Props = {
  attachWebHost?: (node: RNView | null) => void;
  onReady?: () => void;
};

export function DriverCameraPreview({ attachWebHost }: Props) {
  // The camera-check screen owns its tracker. The map PiP needs its own lifecycle.
  if (!attachWebHost) return <OwnedPreview />;
  return <View ref={attachWebHost} collapsable={false} style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }} />;
}

function OwnedPreview() {
  const camera = useWebFaceLandmarks();
  const attach = useCallback((node: RNView | null) => camera.setHost(node as unknown as HTMLElement | null), [camera.setHost]);
  return <View style={{ position: 'absolute', inset: 0 }}>
    <View ref={attach} style={{ position: 'absolute', inset: 0 }} />
    {!camera.ready && <Pressable accessibilityLabel="Reconnect driver camera" onPress={event => { event.stopPropagation(); camera.retry?.(); }} style={{ position: 'absolute', left: 4, right: 4, top: 42, minHeight: 44, justifyContent: 'center', alignItems: 'center', backgroundColor: '#183F31', borderRadius: 10 }}><Text style={{ color: '#FFFFFF', fontSize: 10 }}>{camera.error ? 'Retry camera' : 'Connecting camera…'}</Text></Pressable>}
  </View>;
}
