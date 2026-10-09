import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Platform } from 'react-native';

export type FamilyMember = { id: string; name: string; role: 'parent' | 'teen'; initials: string; latestScore: number; weeklyMiles: number; alerts: number; sharing: boolean };
type FamilyState = { familyName: string; members: FamilyMember[] };
type FamilyContextValue = FamilyState & { addTeen: (name: string) => void; removeMember: (id: string) => void; toggleSharing: (id: string) => void };
const initial: FamilyState = { familyName: 'Mantrala Family', members: [{ id: 'parent-shashank', name: 'Shashank Mantrala', role: 'parent', initials: 'SM', latestScore: 96, weeklyMiles: 21.5, alerts: 1, sharing: true }, { id: 'teen-demo', name: 'Avery Mantrala', role: 'teen', initials: 'AM', latestScore: 91, weeklyMiles: 46.2, alerts: 2, sharing: true }] };
const FamilyContext = createContext<FamilyContextValue | null>(null);
const initials = (name: string) => name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase() ?? '').join('') || 'FM';

export function FamilyProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<FamilyState>(() => { if (Platform.OS !== 'web' || typeof window === 'undefined') return initial; try { return JSON.parse(window.localStorage.getItem('cubo-family') ?? 'null') ?? initial; } catch { return initial; } });
  useEffect(() => { if (Platform.OS === 'web' && typeof window !== 'undefined') window.localStorage.setItem('cubo-family', JSON.stringify(state)); }, [state]);
  const addTeen = useCallback((name: string) => setState((current) => ({ ...current, members: [...current.members, { id: `family-${Date.now()}`, name: name.trim(), role: 'teen', initials: initials(name), latestScore: 100, weeklyMiles: 0, alerts: 0, sharing: true }] })), []);
  const removeMember = useCallback((id: string) => setState((current) => ({ ...current, members: current.members.filter((member) => member.id !== id || member.role === 'parent') })), []);
  const toggleSharing = useCallback((id: string) => setState((current) => ({ ...current, members: current.members.map((member) => member.id === id ? { ...member, sharing: !member.sharing } : member) })), []);
  const value = useMemo(() => ({ ...state, addTeen, removeMember, toggleSharing }), [state, addTeen, removeMember, toggleSharing]);
  return <FamilyContext.Provider value={value}>{children}</FamilyContext.Provider>;
}
export function useFamily() { const value = useContext(FamilyContext); if (!value) throw new Error('useFamily must be used within FamilyProvider'); return value; }
