import * as Location from 'expo-location';
import { Timestamp, collection, deleteDoc, doc, getDoc, onSnapshot, query, serverTimestamp, setDoc, updateDoc, where, writeBatch } from 'firebase/firestore';
import { createContext, type ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { db } from '../../lib/firebase';
import { useAuth } from '../auth/AuthContext';
import { useDrives } from '../drives/DriveContext';
import { useProfile } from '../profile/ProfileContext';
import { connectionPairId, dedupeConnections } from './connectionIdentity';

export type ConnectionKind = 'family' | 'friend';
export type ConnectionRequest = {
  id: string;
  code: string;
  kind: ConnectionKind;
  ownerUid: string;
  ownerName: string;
  requesterUid: string;
  requesterName: string;
  requesterAccountType: 'minor' | 'adult';
  status: 'pending' | 'approved' | 'declined';
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
};
export type CuboConnection = {
  id: string;
  requestId?: string;
  kind: ConnectionKind;
  ownerUid: string;
  ownerName: string;
  memberUid: string;
  memberName: string;
  memberAccountType: 'minor' | 'adult';
  ownerShareScore: boolean;
  ownerShareLocation: boolean;
  memberShareScore: boolean;
  memberShareLocation: boolean;
  ownerScore: number | null;
  memberScore: number | null;
  ownerScoreMeasured?: boolean;
  memberScoreMeasured?: boolean;
  ownerLatitude: number | null;
  ownerLongitude: number | null;
  ownerLocationAt: Timestamp | null;
  memberLatitude: number | null;
  memberLongitude: number | null;
  memberLocationAt: Timestamp | null;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
};
type ShareKey = 'score' | 'location';
type CreatedCode = { code: string; expiresAt: Date; kind: ConnectionKind };
type ConnectionContextValue = {
  connections: CuboConnection[];
  incoming: ConnectionRequest[];
  outgoing: ConnectionRequest[];
  loading: boolean;
  error: string;
  canGenerateFamilyCode: boolean;
  createCode: (kind: ConnectionKind) => Promise<CreatedCode>;
  enterCode: (code: string, expectedKind: ConnectionKind) => Promise<ConnectionRequest>;
  approveRequest: (request: ConnectionRequest) => Promise<void>;
  declineRequest: (request: ConnectionRequest) => Promise<void>;
  setSharing: (connection: CuboConnection, key: ShareKey, enabled: boolean) => Promise<void>;
  removeConnection: (connection: CuboConnection) => Promise<void>;
};

const ConnectionContext = createContext<ConnectionContextValue | null>(null);
const alphabet = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';

function makeCode(kind: ConnectionKind) {
  const values = new Uint32Array(8);
  globalThis.crypto.getRandomValues(values);
  const body = Array.from(values, value => alphabet[value % alphabet.length]).join('');
  return `${kind === 'family' ? 'F' : 'R'}-${body.slice(0, 4)}-${body.slice(4)}`;
}
function normalizeCode(value: string) {
  const compact = value.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (compact.length !== 9 || !['F', 'R'].includes(compact[0])) throw Error('Enter a valid CUBO code.');
  return `${compact[0]}-${compact.slice(1, 5)}-${compact.slice(5)}`;
}
function averageScore(sessions: ReturnType<typeof useDrives>['sessions']) {
  const scored = sessions.filter(item => item.attentionMeasured);
  return scored.length ? Math.round(scored.reduce((sum, item) => sum + item.focusScore, 0) / scored.length) : 100;
}

export function ConnectionProvider({ children }: { children: ReactNode }) {
  const { user, accountDetails } = useAuth();
  const { profile } = useProfile();
  const { sessions } = useDrives();
  const [rawConnections, setRawConnections] = useState<CuboConnection[]>([]);
  const connections = useMemo(() => dedupeConnections(rawConnections), [rawConnections]);
  const [incoming, setIncoming] = useState<ConnectionRequest[]>([]);
  const [outgoing, setOutgoing] = useState<ConnectionRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setRawConnections([]); setIncoming([]); setOutgoing([]); setError('');
    if (!user) return;
    const incomingQuery = query(collection(db, 'connectionRequests'), where('ownerUid', '==', user.uid));
    const outgoingQuery = query(collection(db, 'connectionRequests'), where('requesterUid', '==', user.uid));
    const ownedQuery = query(collection(db, 'connections'), where('ownerUid', '==', user.uid));
    const joinedQuery = query(collection(db, 'connections'), where('memberUid', '==', user.uid));
    let owned: CuboConnection[] = []; let joined: CuboConnection[] = [];
    const merge = () => setRawConnections([...owned, ...joined].filter((item, index, all) => all.findIndex(other => other.id === item.id) === index));
    const unsubs = [
      onSnapshot(incomingQuery, snap => setIncoming(snap.docs.map(item => ({ id: item.id, ...item.data() } as ConnectionRequest)).filter(item => item.status === 'pending')), cause => setError(cause.message)),
      onSnapshot(outgoingQuery, snap => setOutgoing(snap.docs.map(item => ({ id: item.id, ...item.data() } as ConnectionRequest)).filter(item => item.status === 'pending')), cause => setError(cause.message)),
      onSnapshot(ownedQuery, snap => { owned = snap.docs.map(item => ({ id: item.id, ...item.data() } as CuboConnection)); merge(); }, cause => setError(cause.message)),
      onSnapshot(joinedQuery, snap => { joined = snap.docs.map(item => ({ id: item.id, ...item.data() } as CuboConnection)); merge(); }, cause => setError(cause.message)),
    ];
    return () => unsubs.forEach(unsub => unsub());
  }, [user?.uid]);

  // Older builds used a random request ID as the connection ID. Keep the most
  // recently updated relationship and remove older duplicates once per pair.
  useEffect(() => {
    if (!user) return;
    const groups = new Map<string, CuboConnection[]>();
    for (const item of rawConnections) {
      const key = connectionPairId(item.kind, item.ownerUid, item.memberUid);
      groups.set(key, [...(groups.get(key) ?? []), item]);
    }
    for (const items of groups.values()) {
      if (items.length < 2) continue;
      const keep = dedupeConnections(items)[0];
      const firstUid = keep.ownerUid < keep.memberUid ? keep.ownerUid : keep.memberUid;
      if (user.uid !== firstUid) continue;
      void Promise.all(items.filter(item => item.id !== keep.id).map(item => deleteDoc(doc(db, 'connections', item.id)))).catch(() => setError('A duplicate connection is hidden but could not be cleaned up yet. Try again while online.'));
    }
  }, [rawConnections, user?.uid]);

  const currentScore = useMemo(() => averageScore(sessions), [sessions]);
  const currentScoreMeasured = useMemo(() => sessions.some(item => item.attentionMeasured), [sessions]);
  useEffect(() => {
    if (!user) return;
    for (const item of connections) {
      const owner = item.ownerUid === user.uid;
      const enabled = owner ? item.ownerShareScore : item.memberShareScore;
      const saved = owner ? item.ownerScore : item.memberScore;
      const savedMeasured = owner ? item.ownerScoreMeasured : item.memberScoreMeasured;
      if (!enabled || (saved === currentScore && savedMeasured === currentScoreMeasured)) continue;
      const prefix = owner ? 'owner' : 'member';
      void updateDoc(doc(db, 'connections', item.id), { [`${prefix}Score`]: currentScore, [`${prefix}ScoreMeasured`]: currentScoreMeasured, updatedAt: serverTimestamp() }).catch(() => setError('Your shared safety score could not refresh yet.'));
    }
  }, [connections, currentScore, currentScoreMeasured, user?.uid]);

  const canGenerateFamilyCode = accountDetails?.accountType === 'adult' && !connections.some(item => item.kind === 'family' && item.memberUid === user?.uid);
  const createCode = useCallback(async (kind: ConnectionKind) => {
    if (!user) throw Error('Sign in before creating a code.');
    if (kind === 'family' && !canGenerateFamilyCode) throw Error(accountDetails?.accountType === 'minor' ? 'Minors can enter a Family code, but only an adult organizer can create one.' : 'Only the family organizer can create another Family code.');
    setLoading(true); setError('');
    try {
      for (let attempt = 0; attempt < 4; attempt += 1) {
        const code = makeCode(kind);
        const reference = doc(db, 'connectionCodes', code);
        if ((await getDoc(reference)).exists()) continue;
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
        await setDoc(reference, { code, kind, ownerUid: user.uid, ownerName: profile.name, status: 'active', createdAt: serverTimestamp(), expiresAt: Timestamp.fromDate(expiresAt) });
        return { code, expiresAt, kind };
      }
      throw Error('Could not reserve a code. Try again.');
    } finally { setLoading(false); }
  }, [accountDetails?.accountType, canGenerateFamilyCode, profile.name, user?.uid]);

  const enterCode = useCallback(async (rawCode: string, expectedKind: ConnectionKind) => {
    if (!user || !accountDetails) throw Error('Finish setting up your account before joining.');
    const code = normalizeCode(rawCode);
    setLoading(true); setError('');
    try {
      const codeSnap = await getDoc(doc(db, 'connectionCodes', code));
      if (!codeSnap.exists()) throw Error('That code was not found. Check it and try again.');
      const data = codeSnap.data();
      if (data.status !== 'active' || !(data.expiresAt instanceof Timestamp) || data.expiresAt.toMillis() <= Date.now()) throw Error('That code expired. Ask for a new one.');
      if (data.kind !== expectedKind) throw Error(`This is a ${data.kind === 'family' ? 'Family' : 'Friend'} code. Switch to ${data.kind === 'family' ? 'Family' : 'Friends'} to use it.`);
      if (data.ownerUid === user.uid) throw Error('That is your own code. Share it with someone else.');
      const requestId = connectionPairId(data.kind, data.ownerUid, user.uid);
      if (connections.some(item => item.kind === data.kind && connectionPairId(item.kind, item.ownerUid, item.memberUid) === requestId)) throw Error(`This person is already in your ${data.kind === 'family' ? 'family' : 'friends'}.`);
      const previous = await getDoc(doc(db, 'connectionRequests', requestId));
      if (previous.exists() && previous.data().status === 'pending') throw Error('A request between these accounts is already waiting for approval.');
      if (previous.exists() && previous.data().status === 'approved') throw Error(`This person is already in your ${data.kind === 'family' ? 'family' : 'friends'}.`);
      const request: Omit<ConnectionRequest, 'id'> = { code, kind: data.kind, ownerUid: data.ownerUid, ownerName: data.ownerName, requesterUid: user.uid, requesterName: profile.name, requesterAccountType: accountDetails.accountType, status: 'pending' };
      if (previous.exists()) await updateDoc(doc(db, 'connectionRequests', requestId), { ...request, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
      else await setDoc(doc(db, 'connectionRequests', requestId), { ...request, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
      return { id: requestId, ...request };
    } finally { setLoading(false); }
  }, [accountDetails, connections, profile.name, user?.uid]);

  const approveRequest = useCallback(async (request: ConnectionRequest) => {
    if (!user || request.ownerUid !== user.uid) throw Error('Only the code owner can approve this request.');
    setLoading(true); setError('');
    try {
      const connectionId = connectionPairId(request.kind, request.ownerUid, request.requesterUid);
      if (connections.some(item => item.kind === request.kind && connectionPairId(item.kind, item.ownerUid, item.memberUid) === connectionId)) throw Error(`This person is already in your ${request.kind === 'family' ? 'family' : 'friends'}.`);
      const batch = writeBatch(db);
      batch.update(doc(db, 'connectionRequests', request.id), { status: 'approved', updatedAt: serverTimestamp() });
      batch.set(doc(db, 'connections', connectionId), {
        requestId: request.id,
        kind: request.kind, ownerUid: request.ownerUid, ownerName: request.ownerName, memberUid: request.requesterUid, memberName: request.requesterName,
        memberAccountType: request.requesterAccountType, ownerShareScore: false, ownerShareLocation: false, memberShareScore: false, memberShareLocation: false,
        ownerScore: null, memberScore: null, ownerScoreMeasured: false, memberScoreMeasured: false, ownerLatitude: null, ownerLongitude: null, ownerLocationAt: null, memberLatitude: null, memberLongitude: null, memberLocationAt: null,
        createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
      });
      batch.update(doc(db, 'connectionCodes', request.code), { status: 'closed' });
      await batch.commit();
    } finally { setLoading(false); }
  }, [connections, user?.uid]);
  const declineRequest = useCallback(async (request: ConnectionRequest) => {
    if (!user || request.ownerUid !== user.uid) throw Error('Only the code owner can decline this request.');
    setLoading(true); try { await deleteDoc(doc(db, 'connectionRequests', request.id)); } finally { setLoading(false); }
  }, [user?.uid]);

  const setSharing = useCallback(async (connection: CuboConnection, key: ShareKey, enabled: boolean) => {
    if (!user) throw Error('Sign in to update sharing.');
    const owner = connection.ownerUid === user.uid;
    if (!owner && connection.memberUid !== user.uid) throw Error('This connection does not belong to you.');
    setLoading(true); setError('');
    try {
      const prefix = owner ? 'owner' : 'member';
      const update: Record<string, unknown> = { [`${prefix}Share${key === 'score' ? 'Score' : 'Location'}`]: enabled, updatedAt: serverTimestamp() };
      if (key === 'score') {
        update[`${prefix}Score`] = enabled ? averageScore(sessions) : null;
        update[`${prefix}ScoreMeasured`] = enabled && sessions.some(item => item.attentionMeasured);
      }
      if (key === 'location') {
        if (enabled) {
          const permission = await Location.requestForegroundPermissionsAsync();
          if (permission.status !== 'granted') throw Error('Allow location access in Account before sharing your location.');
          const point = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          update[`${prefix}Latitude`] = point.coords.latitude;
          update[`${prefix}Longitude`] = point.coords.longitude;
          update[`${prefix}LocationAt`] = serverTimestamp();
        } else {
          update[`${prefix}Latitude`] = null; update[`${prefix}Longitude`] = null; update[`${prefix}LocationAt`] = null;
        }
      }
      await updateDoc(doc(db, 'connections', connection.id), update);
    } finally { setLoading(false); }
  }, [sessions, user?.uid]);
  const removeConnection = useCallback(async (connection: CuboConnection) => {
    if (!user || (connection.ownerUid !== user.uid && connection.memberUid !== user.uid)) throw Error('This connection does not belong to you.');
    const requestId = connection.requestId ?? connection.id;
    const requestRef = doc(db, 'connectionRequests', requestId);
    const request = await getDoc(requestRef);
    const batch = writeBatch(db);
    batch.delete(doc(db, 'connections', connection.id));
    if (request.exists()) batch.delete(requestRef);
    await batch.commit();
  }, [user?.uid]);

  const value = useMemo<ConnectionContextValue>(() => ({ connections, incoming, outgoing, loading, error, canGenerateFamilyCode, createCode, enterCode, approveRequest, declineRequest, setSharing, removeConnection }), [connections, incoming, outgoing, loading, error, canGenerateFamilyCode, createCode, enterCode, approveRequest, declineRequest, setSharing, removeConnection]);
  return <ConnectionContext.Provider value={value}>{children}</ConnectionContext.Provider>;
}

export function useConnections() {
  const value = useContext(ConnectionContext);
  if (!value) throw Error('useConnections must be used within ConnectionProvider');
  return value;
}
