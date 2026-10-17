import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth } from '../../lib/firebaseAuth';
import type { AttentionBaseline } from '../attention/attentionPolicy';

const key = () => `cubo:camera-calibration:v2:${auth.currentUser?.uid ?? 'signed-out'}`;
export type CalibrationRecord = { completedAt: string; samples: number; baseline: AttentionBaseline; guidedTestPassed?: true };

export async function readCalibration(): Promise<CalibrationRecord | null> {
  const raw = await AsyncStorage.getItem(key());
  const record = raw ? JSON.parse(raw) as CalibrationRecord : null;
  return record?.baseline?.version === 1 ? record : null;
}

export async function saveCalibration(samples: number, baseline: AttentionBaseline, guidedTestPassed = false): Promise<CalibrationRecord> {
  const record: CalibrationRecord = { completedAt: new Date().toISOString(), samples, baseline, ...(guidedTestPassed ? { guidedTestPassed: true as const } : {}) };
  await AsyncStorage.setItem(key(), JSON.stringify(record));
  return record;
}
