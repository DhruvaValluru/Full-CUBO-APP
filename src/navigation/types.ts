import type { NavigatorScreenParams } from '@react-navigation/native';
import type { PlaceResult } from '../features/places/searchPlaces';

export type MainTabParamList = {
  Home: undefined;
  Map: undefined;
  Activity: undefined;
  Garage: undefined;
  Account: undefined;
};

export type RootStackParamList = {
  Splash: undefined;
  MainTabs: NavigatorScreenParams<MainTabParamList> | undefined;
  Drives: undefined;
  Garage: undefined;
  AddVehicle: { vehicleId?: string } | undefined;
  CameraCalibration: undefined;
  ConnectedDevices: undefined;
  CruiseCamera: { deviceId: string };
  Family: undefined;
  Connections: { action?: 'enter' | 'create'; kind?: 'family' | 'friend' } | undefined;
  Notifications: undefined;
  CuboAI: undefined;
  ConnectionProfile: { connectionId: string };
  InsuranceConnection: undefined;
  TripDetail: { sessionId: string };
  SettingsDetail: { kind: 'edit' | 'privacy' | 'help' | 'about' };
  LiveDrive: undefined;
  DriveMap: { destination?: PlaceResult } | undefined;
  ReturningHome: { afterDrive?: boolean } | undefined;
  SavedPlace: { kind: 'home' | 'work' };
  DriveEvents: { sessionId: string };
  VoiceTranscript: { sessionId: string };
  TripSummary: { sessionId: string };
  VehicleDetail: { vehicleId: string };
  DetectionLive: { vehicleId: string };
  DriverReports: { driverId: string };
  Profile: undefined;
  AppBlocking: { targetUid?: string; targetName?: string; parentManaged?: boolean; connectionId?: string } | undefined;
};
