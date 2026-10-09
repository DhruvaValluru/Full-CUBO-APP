import type { LiveSafetyState, SafetyEvent } from './types';

type DemoStep = LiveSafetyState & { event?: Omit<SafetyEvent, 'id' | 'occurredAt' | 'elapsedSeconds'> };

const steps: DemoStep[] = [
  { attention: 'Attentive', speedMph: 34, focusScore: 98, hazardDistanceMeters: 1320, elapsedSeconds: 0 },
  { attention: 'Attentive', speedMph: 39, focusScore: 96, hazardDistanceMeters: 980, elapsedSeconds: 4 },
  {
    attention: 'Caution', speedMph: 42, focusScore: 88, hazardDistanceMeters: 720, elapsedSeconds: 8,
    event: { type: 'looking_away', severity: 'caution', title: 'Attention drifting', detail: 'Eyes off road for 1.4 seconds', speedMph: 42, durationMs: 1400 },
  },
  {
    attention: 'Warning', speedMph: 45, focusScore: 72, hazardDistanceMeters: 410, elapsedSeconds: 12,
    event: { type: 'road_hazard', severity: 'warning', title: 'Compounding road risk', detail: 'Sustained distraction near a reported obstruction', speedMph: 45, durationMs: 2900, hazardDistanceMeters: 410 },
  },
  {
    attention: 'Critical', speedMph: 46, focusScore: 54, hazardDistanceMeters: 220, elapsedSeconds: 16,
    event: { type: 'phone_detected', severity: 'critical', title: 'Refocus immediately', detail: 'Phone detected with a road hazard ahead', speedMph: 46, durationMs: 2100, hazardDistanceMeters: 220 },
  },
  {
    attention: 'Attentive', speedMph: 41, focusScore: 91, hazardDistanceMeters: 90, elapsedSeconds: 20,
    event: { type: 'attention_restored', severity: 'info', title: 'Attention restored', detail: 'Driver refocused after CUBO intervention', speedMph: 41 },
  },
];

export function getDemoStep(step: number): DemoStep {
  return steps[step % steps.length];
}

export const demoStepCount = steps.length;
