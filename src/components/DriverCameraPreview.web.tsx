import { View, type View as RNView } from 'react-native';

type Props = {
  attachWebHost?: (node: RNView | null) => void;
  onReady?: () => void;
};

export function DriverCameraPreview({ attachWebHost }: Props) {
  return <View ref={attachWebHost} collapsable={false} style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }} />;
}
