import { Camera } from 'expo-camera';
import { Linking } from 'react-native';
export type MediaKind = 'camera' | 'microphone';
export const accessHelp = 'If access is blocked, open device settings and allow Camera or Microphone for this app (Expo Go while testing). Permission does not start either device. Your device manages permission retention.';
export const openAccessSettings = () => Linking.openSettings();
export async function checkMediaAccess(kind: MediaKind): Promise<string> {
  const result = await (kind === 'camera' ? Camera.getCameraPermissionsAsync() : Camera.getMicrophonePermissionsAsync());
  return result.granted ? 'Allowed' : result.canAskAgain ? 'Not allowed yet' : 'Blocked · open device settings';
}
export async function requestMediaAccess(kind: MediaKind): Promise<string> {
  const result = await (kind === 'camera' ? Camera.requestCameraPermissionsAsync() : Camera.requestMicrophonePermissionsAsync());
  return result.granted ? 'Allowed · device not started' : result.canAskAgain ? 'Not allowed' : 'Blocked · open device settings';
}
