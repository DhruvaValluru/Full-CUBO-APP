import AsyncStorage from '@react-native-async-storage/async-storage';
import { updateProfile } from 'firebase/auth';
import { collection, doc, getDocs, onSnapshot, query, serverTimestamp, where, writeBatch } from 'firebase/firestore';
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { useAuth } from '../auth/AuthContext';
import { db } from '../../lib/firebase';
import { syncIdentity } from '../auth/syncIdentity';
import { defaultAvatarId, isAvatarId, type AvatarId } from './avatars';

type DriverProfile = { name: string; initials: string; avatarId: AvatarId; photoUri?: string };
type ProfileContextValue = { profile: DriverProfile; updateName: (name: string) => Promise<void>; updateAvatar: (avatarId: AvatarId) => Promise<void>; updatePhoto: (photoUri?: string) => void };

const initialProfile: DriverProfile = { name: 'CUBO Driver', initials: 'CU', avatarId: 'masc-01' };
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
      const cleanName = typeof name === 'string' && name.trim() ? name.trim() : user.displayName?.trim() || 'CUBO Driver';
      const avatarId = isAvatarId(snapshot.data()?.avatarId) ? snapshot.data()!.avatarId as AvatarId : defaultAvatarId(user.uid);
      setProfile((current) => ({ ...current, name: cleanName, initials: makeInitials(cleanName), avatarId }));
    });

    return () => { active = false; unsubscribe(); };
  }, [user]);

  const commitIdentity = useCallback(async (name: string, avatarId: AvatarId) => {
    if (!user) throw Error('Sign in before changing your profile.');
    await syncIdentity(user);
    const [owned, joined] = await Promise.all([
      getDocs(query(collection(db, 'connections'), where('ownerUid', '==', user.uid))),
      getDocs(query(collection(db, 'connections'), where('memberUid', '==', user.uid))),
    ]);
    const batch = writeBatch(db);
    batch.update(doc(db, 'users', user.uid), { name, avatarId, email: user.email, updatedAt: serverTimestamp() });
    owned.docs.forEach(item => batch.update(item.ref, { ownerName: name, ownerAvatarId: avatarId, updatedAt: serverTimestamp() }));
    joined.docs.forEach(item => batch.update(item.ref, { memberName: name, memberAvatarId: avatarId, updatedAt: serverTimestamp() }));
    await batch.commit();
  }, [user]);

  const updateName = useCallback(async (name: string) => {
    const cleanName = name.trim();
    if (!cleanName || !user) return;
    if (cleanName.length > 80) throw Error('Keep your name under 80 characters.');
    await commitIdentity(cleanName, profile.avatarId);
    await updateProfile(user, { displayName: cleanName });
    setProfile((current) => ({ ...current, name: cleanName, initials: makeInitials(cleanName) }));
  }, [commitIdentity, profile.avatarId, user]);
  const updateAvatar = useCallback(async (avatarId: AvatarId) => {
    if (!user) throw Error('Sign in before changing your avatar.');
    await commitIdentity(profile.name, avatarId);
    setProfile((current) => ({ ...current, avatarId }));
  }, [commitIdentity, profile.name, user]);
  const updatePhoto = useCallback((photoUri?: string) => {
    setProfile((current) => ({ ...current, photoUri }));
    if (!user) return;
    const photoKey = `cubo-profile-photo:${user.uid}`;
    if (photoUri) AsyncStorage.setItem(photoKey, photoUri).catch(() => undefined);
    else AsyncStorage.removeItem(photoKey).catch(() => undefined);
  }, [user]);

  const value = useMemo(() => ({ profile, updateName, updateAvatar, updatePhoto }), [profile, updateName, updateAvatar, updatePhoto]);
  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}

export function useProfile() {
  const value = useContext(ProfileContext);
  if (!value) throw new Error('useProfile must be used within ProfileProvider');
  return value;
}
