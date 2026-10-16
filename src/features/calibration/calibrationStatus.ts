import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'cubo:camera-calibration';
export type CalibrationRecord = { completedAt: string; samples: number };

export async function readCalibration(): Promise<CalibrationRecord | null> {
  const raw = await AsyncStorage.getItem(KEY);
  return raw ? JSON.parse(raw) as CalibrationRecord : null;
}

export async function saveCalibration(samples: number): Promise<CalibrationRecord> {
  const record = { completedAt: new Date().toISOString(), samples };
  await AsyncStorage.setItem(KEY, JSON.stringify(record));
  return record;
}
