import { forwardRef, useImperativeHandle } from 'react';
import { View } from 'react-native';
import { DriverCameraPreview } from './DriverCameraPreview';

export type CalibrationCameraHandle = { captureFrame: () => Promise<void> };
type Props = { onReady: () => void };

export const CalibrationCamera = forwardRef<CalibrationCameraHandle, Props>(({ onReady }, ref) => {
  useImperativeHandle(ref, () => ({ captureFrame: async () => undefined }), []);
  return <View style={{ flex: 1 }}><DriverCameraPreview onReady={onReady} /></View>;
});
