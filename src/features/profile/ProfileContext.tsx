import AsyncStorage from '@react-native-async-storage/async-storage';
import { updateProfile } from 'firebase/auth';
import { doc, onSnapshot, serverTimestamp, updateDoc } from 'firebase/firestore';
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { useAuth } from '../auth/AuthContext';
import { db } from '../../lib/firebase';

type DriverProfile = { name: string; initials: string; photoUri?: string };
type ProfileContextValue = { profile: DriverProfile; updateName: (name: string) => Promise<void>; updatePhoto: (photoUri?: string) => void };

const initialProfile: DriverProfile = { name: 'Shashank Mantrala', initials: 'SM' };
const ProfileContext = createContext<ProfileContextValue | null>(null);

function makeInitials(name: string) {
  return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase() ?? '').join('') || 'CU';
}

export function ProfileProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [profile, setProfile] = useState<DriverProfile>(initialProfile);

  useEffect(() => {
    if (!user) {
      setProfile(initialProfile);
      return;
    }

    let active = true;
    const photoKey = `cubo-profile-photo:${user.uid}`;
    AsyncStorage.getItem(photoKey).then((photoUri) => {
      if (active && photoUri) setProfile((current) => ({ ...current, photoUri }));
    }).catch(() => undefined);

    const unsubscribe = onSnapshot(doc(db, 'users', user.uid), (snapshot) => {
      const name = snapshot.data()?.name;
      if (typeof name === 'string' && name.trim()) {
        const cleanName = name.trim();
        setProfile((current) => ({ ...current, name: cleanName, initials: makeInitials(cleanName) }));
      }
    });

    return () => { active = false; unsubscribe(); };
  }, [user]);

  const updateName = useCallback(async (name: string) => {
    const cleanName = name.trim();
    if (!cleanName || !user) return;
    await Promise.all([
      updateProfile(user, { displayName: cleanName }),
      updateDoc(doc(db, 'users', user.uid), { name: cleanName, updatedAt: serverTimestamp() }),
    ]);
    setProfile((current) => ({ ...current, name: cleanName, initials: makeInitials(cleanName) }));
  }, [user]);
  const updatePhoto = useCallback((photoUri?: string) => {
    setProfile((current) => ({ ...current, photoUri }));
    if (!user) return;
    const photoKey = `cubo-profile-photo:${user.uid}`;
    if (photoUri) AsyncStorage.setItem(photoKey, photoUri).catch(() => undefined);
    else AsyncStorage.removeItem(photoKey).catch(() => undefined);
  }, [user]);

  const value = useMemo(() => ({ profile, updateName, updatePhoto }), [profile, updateName, updatePhoto]);
  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}

export function useProfile() {
  const value = useContext(ProfileContext);
  if (!value) throw new Error('useProfile must be used within ProfileProvider');
  return value;
}
