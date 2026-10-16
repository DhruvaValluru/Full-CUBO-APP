import { CameraView, useCameraPermissions } from 'expo-camera';
import { forwardRef, useImperativeHandle, useRef } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export type CalibrationCameraHandle = { captureFrame: () => Promise<void> };
type Props = { onReady: () => void };

export const CalibrationCamera = forwardRef<CalibrationCameraHandle, Props>(({ onReady }, ref) => {
  const camera = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();

  useImperativeHandle(ref, () => ({
    captureFrame: async () => {
      if (!camera.current) return;
      await camera.current.takePictureAsync({ quality: 0.15, skipProcessing: true, shutterSound: false });
    },
  }), []);

  if (!permission) return <View style={s.permission}><Text style={s.permissionTitle}>Checking camera access…</Text></View>;
  if (!permission.granted) return <View style={s.permission}><Text style={s.permissionTitle}>Camera access is required</Text><Text style={s.permissionBody}>CUBO needs the front camera to frame the driver and cabin.</Text><Pressable style={s.permissionButton} onPress={() => void requestPermission()}><Text style={s.permissionButtonText}>Allow camera</Text></Pressable></View>;
  return <CameraView ref={camera} style={StyleSheet.absoluteFill} facing="front" onCameraReady={onReady} />;
});

const s = StyleSheet.create({
  permission: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: '#090D0C', alignItems: 'center', justifyContent: 'center', padding: 28 },
  permissionTitle: { color: '#FFFFFF', fontFamily: 'Manrope_700Bold', fontSize: 17, textAlign: 'center' },
  permissionBody: { color: '#AEBBB5', fontSize: 12, lineHeight: 18, textAlign: 'center', marginTop: 8 },
  permissionButton: { minHeight: 48, borderRadius: 16, paddingHorizontal: 22, backgroundColor: '#2F8F68', justifyContent: 'center', marginTop: 18 },
  permissionButtonText: { color: '#FFFFFF', fontFamily: 'Manrope_800ExtraBold', fontSize: 13 },
});
