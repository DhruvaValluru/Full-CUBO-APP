import { CameraView, useCameraPermissions } from 'expo-camera';
import { Pressable, StyleSheet, Text, View } from 'react-native';

type Props = {
  attachWebHost?: (node: View | null) => void;
  onReady?: () => void;
};

export function DriverCameraPreview({ onReady }: Props) {
  const [permission, requestPermission] = useCameraPermissions();

  if (!permission) {
    return <View style={styles.fallback}><Text style={styles.title}>Checking camera access…</Text></View>;
  }

  if (!permission.granted) {
    return (
      <View style={styles.fallback}>
        <Text style={styles.title}>Front camera access needed</Text>
        <Text style={styles.copy}>CUBO uses the preview during your drive. Frames stay on this device.</Text>
        <Pressable accessibilityRole="button" style={styles.button} onPress={() => void requestPermission()}>
          <Text style={styles.buttonText}>Enable camera</Text>
        </Pressable>
      </View>
    );
  }

  return <CameraView style={StyleSheet.absoluteFill} facing="front" onCameraReady={onReady} />;
}

const styles = StyleSheet.create({
  fallback: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: '#080A0D' },
  title: { color: '#FFFFFF', fontSize: 14, fontFamily: 'Manrope_700Bold', textAlign: 'center' },
  copy: { color: '#A8AFBD', fontSize: 10, lineHeight: 15, textAlign: 'center', marginTop: 6, maxWidth: 260 },
  button: { minHeight: 42, paddingHorizontal: 18, marginTop: 14, borderRadius: 14, backgroundColor: '#2F8F68', alignItems: 'center', justifyContent: 'center' },
  buttonText: { color: '#FFFFFF', fontSize: 12, fontFamily: 'Manrope_800ExtraBold' },
});
