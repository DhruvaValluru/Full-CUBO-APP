import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Platform } from 'react-native';

type DriverProfile = { name: string; initials: string; photoUri?: string };
type ProfileContextValue = { profile: DriverProfile; updateName: (name: string) => void; updatePhoto: (photoUri?: string) => void };

const initialProfile: DriverProfile = { name: 'Shashank Mantrala', initials: 'SM' };
const ProfileContext = createContext<ProfileContextValue | null>(null);

function makeInitials(name: string) {
  return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase() ?? '').join('') || 'CU';
}

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<DriverProfile>(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return initialProfile;
    try {
      const saved = window.localStorage.getItem('cubo-profile');
      return saved ? JSON.parse(saved) : initialProfile;
    } catch {
      return initialProfile;
    }
  });

  useEffect(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.localStorage.setItem('cubo-profile', JSON.stringify(profile));
    }
  }, [profile]);

  const updateName = useCallback((name: string) => {
    const cleanName = name.trim();
    if (cleanName) setProfile((current) => ({ ...current, name: cleanName, initials: makeInitials(cleanName) }));
  }, []);
  const updatePhoto = useCallback((photoUri?: string) => setProfile((current) => ({ ...current, photoUri })), []);

  const value = useMemo(() => ({ profile, updateName, updatePhoto }), [profile, updateName, updatePhoto]);
  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}

export function useProfile() {
  const value = useContext(ProfileContext);
  if (!value) throw new Error('useProfile must be used within ProfileProvider');
  return value;
}
