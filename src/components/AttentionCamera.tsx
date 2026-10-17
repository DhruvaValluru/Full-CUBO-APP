import { View, Text } from 'react-native';
import type { FaceSample } from '../features/attention/attentionPolicy';
export type AttentionCameraProps = { previewFit?: 'cover' | 'contain'; onSample: (sample: FaceSample) => void; onStatus: (message: string) => void };
export function AttentionCamera(_: AttentionCameraProps) { return <View><Text>Monitoring is unavailable on this platform.</Text></View>; }
