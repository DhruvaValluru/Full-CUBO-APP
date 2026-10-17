export type SafetySeverity = 'info' | 'caution' | 'warning' | 'critical';
export type RoadHazardKind = 'object' | 'police' | 'crash';

export type SafetyEventType =
  | 'looking_away'
  | 'eyes_closed'
  | 'phone_detected'
  | 'road_hazard'
  | 'attention_restored';

export type SafetyEvent = {
  id: string;
  type: SafetyEventType;
  severity: SafetySeverity;
  title: string;
  detail: string;
  occurredAt: string;
  elapsedSeconds: number;
  speedMph: number;
  durationMs?: number;
  hazardDistanceMeters?: number;
  hazardKind?: RoadHazardKind;
  latitude?: number;
  longitude?: number;
};

export type DriveSession = {
  voiceTranscript?: import('./voiceTranscript').VoiceTurn[];
  voiceTranscriptLimited?: boolean;
  id: string;
  driverName: string;
  vehicleName: string;
  startedAt: string;
  endedAt?: string;
  durationSeconds: number;
  distanceMiles: number;
  focusScore: number;
  attentionMeasured?: boolean;
  measuredMs?: number;
  attentiveMs?: number;
  interrupted?: boolean;
  events: SafetyEvent[];
  route: RoutePoint[];
};

export type RoutePoint = { latitude: number; longitude: number; recordedAt: string; speedMph: number };

export type LiveSafetyState = {
  attention: 'Attentive' | 'Caution' | 'Warning' | 'Critical';
  speedMph: number;
  focusScore: number;
  hazardDistanceMeters: number;
  elapsedSeconds: number;
};
