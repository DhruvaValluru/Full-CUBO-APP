import { Ionicons } from '@expo/vector-icons';
import { Text, View, StyleSheet } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppHeader } from '../components/AppHeader';
import { ScreenShell } from '../components/ScreenShell';
import { MotionPressable } from '../components/MotionPressable';
import type { RootStackParamList } from '../navigation/types';
import { useAppearance } from '../theme/AppearanceContext';
import type { AppColors } from '../theme/colors';

export function ConnectedDevicesScreen({ navigation }: NativeStackScreenProps<RootStackParamList, 'ConnectedDevices'>) {
  const { colors } = useAppearance();
  const styles = makeStyles(colors);
  return <ScreenShell>
    <AppHeader title="Cubo Devices" onBack={() => navigation.goBack()} />
    <View style={styles.hero}>
      <Ionicons name="videocam-outline" size={32} color="#FFFFFF" />
      <Text style={styles.title}>CUBO Cruise</Text>
      <Text style={styles.subtitle}>A dedicated camera for your vehicle.</Text>
    </View>
    <Text style={styles.body}>This section is dedicated to CUBO Cruise, our optional hardware safety camera. It extends CUBO with a dedicated camera feed and device diagnostics.</Text>
    <Text style={styles.body}>You don’t need CUBO Cruise to use the app. CUBO also works with your phone’s camera.</Text>
    <View style={styles.connection}>
      <MotionPressable disabled accessibilityRole="button" accessibilityState={{ disabled: true }} accessibilityLabel="Connect CUBO Cruise. Disabled in this demo." style={styles.button}>
        <Ionicons name="add" size={20} color={colors.textSecondary} />
        <Text style={styles.buttonText}>Connect CUBO Cruise</Text>
      </MotionPressable>
      <Text style={styles.notice}>Disabled — this app is a demo.</Text>
      <Text style={styles.caption}>Hardware pairing is not available in this version.</Text>
    </View>
  </ScreenShell>;
}

const makeStyles = (c: AppColors) => StyleSheet.create({
  hero: { padding: 24, borderRadius: 24, backgroundColor: '#183D2D', gap: 12 },
  title: { color: '#FFFFFF', fontFamily: 'Manrope_800ExtraBold', fontSize: 28 },
  subtitle: { color: '#D1E3D7', fontSize: 14, lineHeight: 21 },
  body: { color: c.textSecondary, fontSize: 14, lineHeight: 22 },
  connection: { gap: 8, marginTop: 12 },
  button: { minHeight: 56, borderRadius: 16, borderWidth: 1, borderColor: c.borderStrong, backgroundColor: c.surfaceMuted, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 16 },
  buttonText: { color: c.textSecondary, fontFamily: 'Manrope_700Bold', fontSize: 14 },
  notice: { color: c.text, fontFamily: 'Manrope_700Bold', fontSize: 12, textAlign: 'center', marginTop: 4 },
  caption: { color: c.textSecondary, fontSize: 12, lineHeight: 18, textAlign: 'center' },
});
