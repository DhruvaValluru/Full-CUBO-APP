import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { auth } from '../../lib/firebaseAuth';
import type { AccountDetails } from '../auth/accountDetails';
import { AppState } from 'react-native';
import { useAuth } from '../auth/AuthContext';
import { emptyFamily, familyApiConfigured, familyRequest, type FamilySnapshot } from './familyApi';

type Value = FamilySnapshot & { loading: boolean; error: string; configured: boolean; refresh: () => Promise<void>; invite: (email: string) => Promise<void>; respond: (id: string, accept: boolean) => Promise<void>; leave: () => Promise<void>; markRead: () => Promise<void>; saveAccount: (details: AccountDetails) => Promise<void>; requestAge: (birthDate: string, phoneNumber?: string) => Promise<void>; reviewAge: (id: string, approve: boolean) => Promise<void>; setGuardian: (uid: string, enabled: boolean) => Promise<void>; removeMember: (uid: string) => Promise<void> };
const Context = createContext<Value | null>(null);
export function FamilyProvider({ children }: { children: ReactNode }) {
  const { user, accountDetails, saveAccountDetails } = useAuth();
  const snapshotOwner = useRef<string | null>(null);
  const busy = useRef(false);
  const [snapshot, setSnapshot] = useState<FamilySnapshot>(emptyFamily);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const refresh = useCallback(async () => {
    if (!user || !familyApiConfigured) return;
    try { const result = await familyRequest<FamilySnapshot>('/family'); if (auth.currentUser?.uid === user.uid) { snapshotOwner.current = user.uid; setSnapshot(result); setError(''); } } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not sync family.'); }
  }, [user?.uid]);
  useEffect(() => {
    let active = true; snapshotOwner.current = null; busy.current = false; setLoading(false); setSnapshot(emptyFamily); setError('');
    if (!user || !familyApiConfigured) return;
    const sync = async () => { try { const result = await familyRequest<FamilySnapshot>('/family'); if (active && auth.currentUser?.uid === user.uid) { snapshotOwner.current = user.uid; setSnapshot(result); setError(''); } } catch (cause) { if (active) setError(cause instanceof Error ? cause.message : 'Could not sync family.'); } };
    void sync(); const interval = setInterval(() => { if (AppState.currentState === 'active') void sync(); }, 15000);
    const listener = AppState.addEventListener('change', state => { if (state === 'active') void sync(); });
    return () => { active = false; clearInterval(interval); listener.remove(); };
  }, [user?.uid]);
  useEffect(() => {
    if (!user || !familyApiConfigured || !accountDetails || snapshot.account || snapshot.organizerUid) return;
    let active = true;
    void familyRequest<FamilySnapshot>('/account/details', accountDetails).then(result => { if (active && auth.currentUser?.uid === user.uid) { snapshotOwner.current = user.uid; setSnapshot(result); } }).catch(() => undefined);
    return () => { active = false; };
  }, [user?.uid, accountDetails?.birthDate, snapshot.account, snapshot.organizerUid]);
  useEffect(() => { if (snapshot.account && user && snapshotOwner.current === user.uid) void saveAccountDetails(snapshot.account).catch(cause => setError(cause instanceof Error ? cause.message : 'Could not sync account details to Firebase.')); }, [snapshot.account?.birthDate, snapshot.account?.phoneNumber, user?.uid, saveAccountDetails]);
  const action = async (path: string, body: unknown) => {
    if (busy.current) throw Error('Another update is still saving. Please try again in a moment.');
    busy.current = true;
    setLoading(true); setError('');
    try { const result = await familyRequest<FamilySnapshot>(path, body); if (auth.currentUser?.uid === user?.uid) { snapshotOwner.current = user?.uid ?? null; setSnapshot(result); } } catch (cause) { const message = cause instanceof Error ? cause.message : 'Could not complete request.'; setError(message); throw Error(message); } finally { if (auth.currentUser?.uid === user?.uid) { busy.current = false; setLoading(false); } }
  };
  return <Context.Provider value={{ ...snapshot, loading, error, configured: familyApiConfigured, refresh, invite: email => action('/family/invite', { email: email.trim().toLowerCase() }), respond: (id, accept) => action('/family/respond', { id, accept }), leave: () => action('/family/leave', {}), markRead: () => action('/notifications/read', {}), saveAccount: details => action('/account/details', details), requestAge: (birthDate, phoneNumber) => action('/family/age/request', { birthDate, phoneNumber }), reviewAge: (id, approve) => action('/family/age/review', { id, approve }), setGuardian: (uid, enabled) => action('/family/guardian', { uid, enabled }), removeMember: uid => action('/family/remove', { uid }) }}>{children}</Context.Provider>;
}
export function useFamily() { const value = useContext(Context); if (!value) throw Error('FamilyProvider missing'); return value; }
