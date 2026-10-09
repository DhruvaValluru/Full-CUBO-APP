import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { Alert, Linking, Pressable, StyleSheet, Text } from 'react-native';
import { useAppearance } from '../theme/AppearanceContext';

export function ProfilePhotoButton({ onPhoto }: { onPhoto: (uri: string) => void }) {
  const { colors } = useAppearance();
  const [choosing, setChoosing] = useState(false);

  const choose = async () => {
    if (choosing) return;
    setChoosing(true);
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Photo access is off', 'Allow CUBO to access your photos to choose a profile picture.', permission.canAskAgain ? [{ text: 'OK' }] : [{ text: 'Cancel', style: 'cancel' }, { text: 'Open Settings', onPress: () => void Linking.openSettings() }]);
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: .72 });
      if (!result.canceled && result.assets[0]?.uri) onPhoto(result.assets[0].uri);
    } catch {
      Alert.alert('Could not open photos', 'Please try choosing your profile picture again.');
    } finally {
      setChoosing(false);
    }
  };

  return <Pressable disabled={choosing} onPress={() => void choose()} style={[styles.button, { backgroundColor: colors.accent }, choosing && styles.disabled]}><Ionicons name={choosing ? 'hourglass-outline' : 'camera-outline'} size={16} color={colors.onAccent} /><Text style={[styles.text, { color: colors.onAccent }]}>{choosing ? 'Opening photos…' : 'Choose photo'}</Text></Pressable>;
}

const styles = StyleSheet.create({ button: { minHeight: 44, borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 }, disabled: { opacity: .55 }, text: { fontFamily: 'Manrope_700Bold', fontSize: 12 } });
