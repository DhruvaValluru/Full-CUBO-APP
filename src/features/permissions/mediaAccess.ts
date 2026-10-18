import { Camera } from 'expo-camera';
import { Linking } from 'react-native';
import { getForegroundPermissionsAsync, requestForegroundPermissionsAsync } from 'expo-location';
export type MediaKind = 'camera' | 'microphone' | 'location';
export const accessHelp = 'If access is blocked, open device settings and allow Camera, Microphone or Location for this app (Expo Go while testing). Permission does not start tracking or recording. Your device manages permission retention.';
export const openAccessSettings = () => Linking.openSettings();
export async function checkMediaAccess(kind: MediaKind): Promise<string> {
  const result = await (kind === 'location' ? getForegroundPermissionsAsync() : kind === 'camera' ? Camera.getCameraPermissionsAsync() : Camera.getMicrophonePermissionsAsync());
  return result.granted ? 'Allowed' : result.canAskAgain ? 'Not allowed yet' : 'Blocked · open device settings';
}
export async function requestMediaAccess(kind: MediaKind, _signal?: AbortSignal): Promise<string> {
  const result = await (kind === 'location' ? requestForegroundPermissionsAsync() : kind === 'camera' ? Camera.requestCameraPermissionsAsync() : Camera.requestMicrophonePermissionsAsync());
  return result.granted ? 'Allowed · device not started' : result.canAskAgain ? 'Not allowed' : 'Blocked · open device settings';
}
