import AsyncStorage from '@react-native-async-storage/async-storage';
import * as firebaseAuth from 'firebase/auth';
import type { Persistence } from 'firebase/auth';
import { firebaseApp } from './firebase';

export const auth = (() => {
  try {
    const getReactNativePersistence = (firebaseAuth as typeof firebaseAuth & {
      getReactNativePersistence: (storage: typeof AsyncStorage) => Persistence;
    }).getReactNativePersistence;
    return firebaseAuth.initializeAuth(firebaseApp, { persistence: getReactNativePersistence(AsyncStorage) });
  } catch {
    return firebaseAuth.getAuth(firebaseApp);
  }
})();
