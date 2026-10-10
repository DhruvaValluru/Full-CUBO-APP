import type { AccountDetails } from '../auth/accountDetails';
import { auth } from '../../lib/firebaseAuth';

export type FamilyPerson = { uid: string; name: string; email: string; photoUri?: string; role: 'organizer' | 'guardian' | 'member'; sharing: boolean; accountType?: 'minor' | 'adult' };
export type FamilyInvite = { id: string; organizerUid: string; organizerName: string; recipientEmail: string; status: 'pending' | 'accepted' | 'declined'; emailDelivery: 'sent' | 'not-configured' };
export type FamilyNotice = { id: string; title: string; body: string; createdAt: string; read: boolean; inviteId?: string };
export type AgeRequest = { id: string; uid: string; name: string; organizerUid: string; previousBirthDate: string | null; birthDate: string; status: 'pending' | 'approved' | 'declined' };
export type FamilySnapshot = { account: AccountDetails | null; ageRequests: AgeRequest[]; members: FamilyPerson[]; invitations: FamilyInvite[]; notifications: FamilyNotice[]; organizerUid: string | null };
export const emptyFamily: FamilySnapshot = { account: null, ageRequests: [], members: [], invitations: [], notifications: [], organizerUid: null };
export const familyApiConfigured = !!process.env.EXPO_PUBLIC_FAMILY_API_URL;
export async function familyRequest<T>(path: string, body?: unknown): Promise<T> {
  const base = process.env.EXPO_PUBLIC_FAMILY_API_URL;
  if (!base) throw Error('Family syncing needs the family server connection. No invitation or email has been sent.');
  const token = await auth.currentUser?.getIdToken();
  if (!token) throw Error('Sign in to manage your family.');
  const controller = new AbortController(); const timeout = setTimeout(() => controller.abort(), 12000);
  try {
    const response = await fetch(`${base.replace(/\/$/, '')}${path}`, { method: body === undefined ? 'GET' : 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: body === undefined ? undefined : JSON.stringify(body), signal: controller.signal });
    const result = await response.json();
    if (!response.ok) throw Error(result.error ?? 'Family request failed.');
    return result as T;
  } finally { clearTimeout(timeout); }
}
