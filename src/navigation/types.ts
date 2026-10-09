export type RootStackParamList = {
  Splash: undefined;
  MainTabs: undefined;
  Drives: undefined;
  Garage: undefined;
  AddVehicle: { vehicleId?: string } | undefined;
  ConnectedDevices: undefined;
  Family: undefined;
  InsuranceConnection: undefined;
  TripDetail: { sessionId: string };
  SettingsDetail: { kind: 'edit' | 'privacy' | 'help' | 'about' };
  LiveDrive: undefined;
  TripSummary: { sessionId: string };
  VehicleDetail: { vehicleId: string };
  DetectionLive: { vehicleId: string };
  DriverReports: { driverId: string };
  Profile: undefined;
  AppBlocking: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Map: undefined;
};
