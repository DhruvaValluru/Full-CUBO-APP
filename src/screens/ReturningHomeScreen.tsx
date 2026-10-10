import { useEffect } from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { LoadingScreen } from '../components/LoadingScreen';
import type { RootStackParamList } from '../navigation/types';
export function ReturningHomeScreen({ navigation }: NativeStackScreenProps<RootStackParamList, 'ReturningHome'>) {
  useEffect(() => { const timer = setTimeout(() => navigation.reset({ index: 0, routes: [{ name: 'MainTabs', params: { screen: 'Home' } }] }), 240); return () => clearTimeout(timer); }, [navigation]);
  return <LoadingScreen />;
}
