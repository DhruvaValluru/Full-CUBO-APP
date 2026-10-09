import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, Theme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Platform, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts, Manrope_400Regular, Manrope_500Medium, Manrope_600SemiBold, Manrope_700Bold, Manrope_800ExtraBold } from '@expo-google-fonts/manrope';
import { useState } from 'react';

import { PhoneFrame } from './src/components/PhoneFrame';
import { TabBar } from './src/components/TabBar';
import { HomeScreen } from './src/screens/HomeScreen';
import { DrivesScreen } from './src/screens/DrivesScreen';
import { GarageScreen } from './src/screens/GarageScreen';
import { LiveDriveScreen } from './src/screens/LiveDriveScreen';
import { TripSummaryScreen } from './src/screens/TripSummaryScreen';
import { DriveProvider } from './src/features/drives/DriveContext';
import { DetectionScreen } from './src/screens/DetectionScreen';
import { DriverReportsScreen } from './src/screens/DriverReportsScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';
import { SplashScreen } from './src/screens/SplashScreen';
import { VehicleDetailScreen } from './src/screens/VehicleDetailScreen';
import { AppBlockingScreen } from './src/screens/AppBlockingScreen';
import { MainTabParamList, RootStackParamList } from './src/navigation/types';
import { colors } from './src/theme/colors';
import { AppearanceProvider, useAppearance } from './src/theme/AppearanceContext';
import { VehicleProvider } from './src/features/vehicles/VehicleContext';
import { AddVehicleScreen } from './src/screens/AddVehicleScreen';
import { TripDetailScreen } from './src/screens/TripDetailScreen';
import { SettingsDetailScreen } from './src/screens/SettingsDetailScreen';
import { ProfileProvider } from './src/features/profile/ProfileContext';
import { DeviceProvider } from './src/features/devices/DeviceContext';
import { ConnectedDevicesScreen } from './src/screens/ConnectedDevicesScreen';
import { FamilyProvider } from './src/features/family/FamilyContext';
import { InsuranceProvider } from './src/features/insurance/InsuranceContext';
import { FamilyScreen } from './src/screens/FamilyScreen';
import { InsuranceConnectionScreen } from './src/screens/InsuranceConnectionScreen';
import { MapScreen } from './src/screens/MapScreen';
import { AuthProvider, useAuth } from './src/features/auth/AuthContext';
import { AuthScreen } from './src/screens/AuthScreen';
import { WelcomeScreen } from './src/screens/WelcomeScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

const navTheme: Theme = {
  dark: true,
  colors: {
    primary: colors.accentLime,
    background: colors.background,
    card: colors.card,
    text: colors.text,
    border: colors.border,
    notification: colors.danger,
  },
  fonts: {
    regular: { fontFamily: 'System', fontWeight: '400' },
    medium: { fontFamily: 'System', fontWeight: '500' },
    bold: { fontFamily: 'System', fontWeight: '700' },
    heavy: { fontFamily: 'System', fontWeight: '800' },
  },
};

const MainTabs = () => {
  const { colors } = useAppearance();
  return (
    <Tab.Navigator
      initialRouteName="Home"
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: colors.background },
      }}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ tabBarLabel: 'Home' }} />
      <Tab.Screen name="Map" component={MapScreen} options={{ tabBarLabel: 'Map' }} />
    </Tab.Navigator>
  );
};

const Wrapper = Platform.OS === 'web' ? View : GestureHandlerRootView;

function AppNavigation() {
  const { user, loading } = useAuth();
  const [hasStarted, setHasStarted] = useState(false);
  const { colors, mode } = useAppearance();
  const [fontsLoaded] = useFonts({ Manrope_400Regular, Manrope_500Medium, Manrope_600SemiBold, Manrope_700Bold, Manrope_800ExtraBold });
  if (!fontsLoaded || loading) return <View style={{ flex: 1, backgroundColor: colors.background }} />;
  if (!hasStarted) return <WelcomeScreen onGetStarted={() => setHasStarted(true)} />;
  if (!user) return <AuthScreen onBack={() => setHasStarted(false)} />;
  const theme = { ...navTheme, dark: mode === 'dark', colors: { ...navTheme.colors, primary: colors.gaugeProgress, background: colors.background, card: colors.card, text: colors.text, border: colors.border } };
  return (
        <DriveProvider>
        <NavigationContainer theme={theme}>
          <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />
          <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
            <Stack.Screen name="MainTabs" component={MainTabs} options={{ animation: 'fade' }} />
            <Stack.Screen name="Splash" component={SplashScreen} options={{ animation: 'fade' }} />
            <Stack.Screen name="Drives" component={DrivesScreen} options={{ animation: 'slide_from_right' }} />
            <Stack.Screen name="Garage" component={GarageScreen} options={{ animation: 'slide_from_right' }} />
            <Stack.Screen name="AddVehicle" component={AddVehicleScreen} options={{ animation: 'slide_from_bottom' }} />
            <Stack.Screen name="ConnectedDevices" component={ConnectedDevicesScreen} options={{ animation: 'slide_from_right' }} />
            <Stack.Screen name="Family" component={FamilyScreen} options={{ animation: 'slide_from_right' }} />
            <Stack.Screen name="InsuranceConnection" component={InsuranceConnectionScreen} options={{ animation: 'slide_from_right' }} />
            <Stack.Screen name="TripDetail" component={TripDetailScreen} options={{ animation: 'slide_from_right' }} />
            <Stack.Screen name="SettingsDetail" component={SettingsDetailScreen} options={{ animation: 'slide_from_right' }} />
            <Stack.Screen name="LiveDrive" component={LiveDriveScreen} options={{ animation: 'fade_from_bottom' }} />
            <Stack.Screen name="TripSummary" component={TripSummaryScreen} options={{ animation: 'slide_from_right' }} />
            <Stack.Screen name="VehicleDetail" component={VehicleDetailScreen} options={{ animation: 'slide_from_right' }} />
            <Stack.Screen name="DriverReports" component={DriverReportsScreen} options={{ animation: 'slide_from_right' }} />
            <Stack.Screen name="DetectionLive" component={DetectionScreen} options={{ animation: 'fade_from_bottom' }} />
            <Stack.Screen name="Profile" component={ProfileScreen} options={{ animation: 'slide_from_right' }} />
            <Stack.Screen name="AppBlocking" component={AppBlockingScreen} options={{ animation: 'slide_from_right' }} />
          </Stack.Navigator>
        </NavigationContainer>
        </DriveProvider>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <PhoneFrame>
        <Wrapper style={{ flex: 1 }}>
          <AppearanceProvider><AuthProvider><ProfileProvider><VehicleProvider><DeviceProvider><FamilyProvider><InsuranceProvider><AppNavigation /></InsuranceProvider></FamilyProvider></DeviceProvider></VehicleProvider></ProfileProvider></AuthProvider></AppearanceProvider>
        </Wrapper>
      </PhoneFrame>
    </SafeAreaProvider>
  );
}
