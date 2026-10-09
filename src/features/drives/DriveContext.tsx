import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Platform } from 'react-native';

import type { DriveSession, SafetyEvent } from './types';

type DriveContextValue = {
  activeSession: DriveSession | null;
  sessions: DriveSession[];
  startDrive: () => void;
  addEvent: (event: Omit<SafetyEvent, 'id' | 'occurredAt'>) => void;
  updateDrive: (values: Pick<DriveSession, 'durationSeconds' | 'focusScore' | 'distanceMiles'>) => void;
  endDrive: () => DriveSession | null;
  addRoutePoint: (latitude: number, longitude: number, speedMph: number) => void;
};

const DriveContext = createContext<DriveContextValue | null>(null);

const previousSessions: DriveSession[] = [
  {
    id: 'demo-trip-1', driverName: 'Shashank', vehicleName: 'Toyota Prius',
    startedAt: new Date(Date.now() - 86400000).toISOString(), endedAt: new Date(Date.now() - 85440000).toISOString(),
    durationSeconds: 960, distanceMiles: 8.4, focusScore: 92, events: [], route: [
      { latitude: 35.7796, longitude: -78.6382, recordedAt: new Date(Date.now() - 86400000).toISOString(), speedMph: 18 },
      { latitude: 35.7819, longitude: -78.6321, recordedAt: new Date(Date.now() - 86340000).toISOString(), speedMph: 31 },
      { latitude: 35.7862, longitude: -78.6263, recordedAt: new Date(Date.now() - 86280000).toISOString(), speedMph: 38 },
      { latitude: 35.7901, longitude: -78.6184, recordedAt: new Date(Date.now() - 86220000).toISOString(), speedMph: 24 },
    ],
  },
  {
    id: 'demo-trip-2', driverName: 'Shashank', vehicleName: 'Toyota Prius',
    startedAt: new Date(Date.now() - 259200000).toISOString(), endedAt: new Date(Date.now() - 257820000).toISOString(),
    durationSeconds: 1380, distanceMiles: 13.1, focusScore: 86, events: [], route: [
      { latitude: 35.771, longitude: -78.66, recordedAt: new Date(Date.now() - 259200000).toISOString(), speedMph: 22 },
      { latitude: 35.776, longitude: -78.651, recordedAt: new Date(Date.now() - 259100000).toISOString(), speedMph: 36 },
      { latitude: 35.782, longitude: -78.642, recordedAt: new Date(Date.now() - 259000000).toISOString(), speedMph: 29 },
    ],
  },
];

export function DriveProvider({ children }: { children: ReactNode }) {
  const [activeSession, setActiveSession] = useState<DriveSession | null>(null);
  const [sessions, setSessions] = useState<DriveSession[]>(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return previousSessions;
    try { const saved = window.localStorage.getItem('cubo-drive-sessions'); return saved ? (JSON.parse(saved) as DriveSession[]).map((session) => ({ ...session, route: session.route ?? [] })) : previousSessions; } catch { return previousSessions; }
  });

  useEffect(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') window.localStorage.setItem('cubo-drive-sessions', JSON.stringify(sessions));
  }, [sessions]);

  const startDrive = useCallback(() => setActiveSession({
      id: `trip-${Date.now()}`,
      driverName: 'Shashank',
      vehicleName: 'Toyota Prius',
      startedAt: new Date().toISOString(),
      durationSeconds: 0,
      distanceMiles: 0,
      focusScore: 100,
      events: [],
      route: [],
    }), []);

  const addEvent = useCallback((event: Omit<SafetyEvent, 'id' | 'occurredAt'>) => setActiveSession((current) => current ? ({
      ...current,
      events: [...current.events, { ...event, id: `event-${Date.now()}-${current.events.length}`, occurredAt: new Date().toISOString() }],
    }) : current), []);

  const updateDrive = useCallback((values: Pick<DriveSession, 'durationSeconds' | 'focusScore' | 'distanceMiles'>) => {
    setActiveSession((current) => current ? ({ ...current, ...values }) : current);
  }, []);

  const addRoutePoint = useCallback((latitude: number, longitude: number, speedMph: number) => setActiveSession((current) => current ? ({
    ...current,
    route: [...current.route, { latitude, longitude, speedMph, recordedAt: new Date().toISOString() }],
  }) : current), []);

  const endDrive = useCallback(() => {
      if (!activeSession) return null;
      const completed = { ...activeSession, endedAt: new Date().toISOString() };
      setSessions((current) => [completed, ...current]);
      setActiveSession(null);
      return completed;
    }, [activeSession]);

  const value = useMemo<DriveContextValue>(() => ({
    activeSession,
    sessions,
    startDrive,
    addEvent,
    updateDrive,
    endDrive,
    addRoutePoint,
  }), [activeSession, sessions, startDrive, addEvent, updateDrive, endDrive, addRoutePoint]);

  return <DriveContext.Provider value={value}>{children}</DriveContext.Provider>;
}

export function useDrives() {
  const value = useContext(DriveContext);
  if (!value) throw new Error('useDrives must be used within DriveProvider');
  return value;
}
