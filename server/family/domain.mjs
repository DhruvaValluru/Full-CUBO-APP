import { randomUUID } from 'node:crypto';
export const freshState = () => ({ profiles: {}, invitations: [], memberships: {}, notifications: {}, drives: {}, guardians: {}, ageRequests: [], feedback: [] });
export function notice(state, uid, title, body, inviteId) {
  state.notifications[uid] = [{ id: randomUUID(), title, body, inviteId, createdAt: new Date().toISOString(), read: false }, ...(state.notifications[uid] ?? [])].slice(0, 200);
}
export function register(state, identity) {
  state.guardians ??= {}; state.ageRequests ??= []; state.feedback ??= [];
  const previous = state.profiles[identity.uid] ?? {};
  state.profiles[identity.uid] = { ...previous, uid: identity.uid, name: identity.name, email: identity.email, role: 'member', sharing: true };
  state.invitations.filter(item => item.recipientEmail === identity.email && item.status === 'pending' && Date.parse(item.expiresAt) > Date.now()).forEach(item => {
    if (!(state.notifications[identity.uid] ?? []).some(value => value.inviteId === item.id)) notice(state, identity.uid, 'Family invitation', `${item.organizerName} requested that you join their family.`, item.id);
  });
}
export function snapshot(state, identity) {
  const organizer = state.memberships[identity.uid] ?? null;
  const root = organizer ?? identity.uid;
  const children = Object.keys(state.memberships).filter(uid => state.memberships[uid] === root);
  const ids = children.length || organizer ? [root, ...children] : [];
  return { organizerUid: organizer, account: state.profiles[identity.uid]?.account ?? null, ageRequests: state.ageRequests.filter(item => item.uid === identity.uid || ((item.organizerUid === identity.uid || state.guardians[identity.uid] === item.organizerUid) && state.memberships[item.uid] === item.organizerUid)).map(({ phoneNumber, ...item }) => item), members: ids.filter(uid => state.profiles[uid]).map(uid => ({ uid, name: state.profiles[uid].name, email: state.profiles[uid].email, sharing: true, accountType: state.profiles[uid].account?.accountType, role: uid === root ? 'organizer' : state.guardians[uid] === root ? 'guardian' : 'member' })), invitations: state.invitations.filter(item => item.organizerUid === identity.uid || item.recipientEmail === identity.email), notifications: state.notifications[identity.uid] ?? [] };
}
export function invite(state, identity, email) {
  if (!identity.emailVerified) throw Error('Verify your account email before inviting family members.');
  if (!state.profiles[identity.uid]?.account || isMinor(state.profiles[identity.uid].account.birthDate)) throw Error('Add an adult date of birth to your account before organizing a family.');
  email = String(email ?? '').trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) throw Error('Enter a valid email address.');
  if (email === identity.email) throw Error('You cannot invite yourself.');
  if (state.memberships[identity.uid]) throw Error('Only a family organizer can send invitations.');
  if (state.invitations.some(item => item.organizerUid === identity.uid && item.recipientEmail === email && item.status === 'pending')) throw Error('An invitation to this email is already pending.');
  if (state.invitations.filter(item => item.organizerUid === identity.uid && item.status === 'pending').length >= 10) throw Error('You have too many pending invitations.');
  const item = { id: randomUUID(), organizerUid: identity.uid, organizerName: identity.name, recipientEmail: email, status: 'pending', emailDelivery: 'not-configured', createdAt: new Date().toISOString(), expiresAt: new Date(Date.now() + 7 * 86400000).toISOString() };
  state.invitations.push(item);
  const recipient = Object.values(state.profiles).find(person => person.email === email);
  if (recipient) notice(state, recipient.uid, 'Family invitation', `${identity.name} requested that you join their family.`, item.id);
  return item;
}
export function respond(state, identity, id, accept) {
  const item = state.invitations.find(value => value.id === id);
  if (!item || item.recipientEmail !== identity.email || item.status !== 'pending') throw Error('This invitation is not available to your account.');
  if (Date.parse(item.expiresAt) < Date.now()) throw Error('This invitation has expired.');
  if (typeof accept !== 'boolean') throw Error('Choose accept or decline.');
  if (accept) {
    if (!identity.emailVerified) throw Error('Verify your account email before accepting a family invitation.');
    if (state.memberships[identity.uid]) throw Error('Leave your current family before joining another.');
    if (Object.values(state.memberships).includes(identity.uid)) throw Error('An organizer cannot join another family while managing members.');
    if (state.memberships[item.organizerUid]) throw Error('This organizer is no longer available.');
    state.memberships[identity.uid] = item.organizerUid;
  }
  item.status = accept ? 'accepted' : 'declined';
  notice(state, item.organizerUid, accept ? 'Family invitation accepted' : 'Family invitation declined', `${identity.name} ${accept ? 'joined your family and agreed to share driving summaries' : 'declined your invitation'}.`);
}
export function leave(state, identity) {
  const organizer = state.memberships[identity.uid];
  if (!organizer) throw Error('You are not a member of another family.');
  delete state.memberships[identity.uid];
  delete state.guardians[identity.uid];
  state.ageRequests = state.ageRequests.filter(item => item.uid !== identity.uid);
  delete state.drives[identity.uid];
  notice(state, organizer, 'Family member left', `${identity.name} left your family. Access to their driving summaries has ended.`);
  notice(state, identity.uid, 'You left the family', 'Your former organizer can no longer access your shared drives.');
}
export function canReadDrives(state, viewer, owner) {
  const root = state.memberships[owner];
  return Boolean(viewer === owner || root === viewer || (root && state.guardians[viewer] === root && state.guardians[owner] !== root && isMinor(state.profiles[owner]?.account?.birthDate)));
}
export function sanitizeDrive(input) {
  if (!input || typeof input.id !== 'string' || input.id.length > 100 || typeof input.vehicleName !== 'string' || input.vehicleName.length > 160 || !Number.isFinite(Date.parse(input.endedAt))) throw Error('Invalid drive summary.');
  for (const key of ['durationSeconds', 'distanceMiles', 'alertCount']) if (!Number.isFinite(input[key]) || input[key] < 0) throw Error('Invalid drive summary.');
  if (input.focusScore !== null && (!Number.isFinite(input.focusScore) || input.focusScore < 0 || input.focusScore > 100)) throw Error('Invalid focus score.');
  return { id: input.id, vehicleName: input.vehicleName, endedAt: input.endedAt, durationSeconds: input.durationSeconds, distanceMiles: input.distanceMiles, alertCount: input.alertCount, focusScore: input.focusScore };
}

export function ageOf(birthDate, now = new Date()) {
  if (typeof birthDate !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(birthDate)) throw Error('Enter a valid date of birth.');
  const [year, month, day] = birthDate.split('-').map(Number);
  const birth = new Date(year, month - 1, day);
  if (birth.getFullYear() !== year || birth.getMonth() !== month - 1 || birth.getDate() !== day || birth > now) throw Error('Enter a valid date of birth.');
  const age = now.getFullYear() - year - (now.getMonth() < month - 1 || (now.getMonth() === month - 1 && now.getDate() < day) ? 1 : 0);
  if (age > 120) throw Error('Check your birth year.');
  return age;
}
export function isMinor(birthDate) { try { return ageOf(birthDate) < 18; } catch { return false; } }
export function updateAccount(state, who, input) {
  if (!input || typeof input.phoneNumber !== 'string' || (input.phoneNumber && !/^\+[1-9]\d{7,14}$/.test(input.phoneNumber))) throw Error('Enter a valid phone number with country code, or leave it blank.');
  const age = ageOf(input.birthDate);
  if (age < 18 && (state.guardians[who.uid] || Object.values(state.memberships).includes(who.uid))) throw Error('An Organizer or Parent/Guardian must keep an adult account. Resolve family permissions before changing to a minor birth date.');
  const previous = state.profiles[who.uid].account;
  const organizer = state.memberships[who.uid];
  // Unknown ages are locked as well once linked: another device cannot seed an adult DOB to bypass review.
  if (organizer && (!previous || isMinor(previous.birthDate)) && previous?.birthDate !== input.birthDate) throw Error('Request parent approval to change your date of birth.');
  const account = { birthDate: input.birthDate, phoneNumber: input.phoneNumber, accountType: age < 18 ? 'minor' : 'adult', ageVerification: 'self-declared', phoneVerification: 'unverified', guardianStatus: 'not-linked' };
  state.profiles[who.uid].account = account;
  return account;
}
export function requestAgeChange(state, who, birthDate, phoneNumber) {
  ageOf(birthDate);
  const organizerUid = state.memberships[who.uid];
  if (!organizerUid) throw Error('You are not linked to a family.');
  const previous = state.profiles[who.uid].account;
  if (previous && !isMinor(previous.birthDate)) throw Error('Adult accounts can edit their own birth date.');
  if (state.ageRequests.some(item => item.uid === who.uid && item.status === 'pending')) throw Error('A birth-date change is already waiting for approval.');
  if (!previous && (phoneNumber != null && (typeof phoneNumber !== 'string' || (phoneNumber && !/^\+[1-9]\d{7,14}$/.test(phoneNumber))))) throw Error('Enter a valid phone number with country code, or leave it blank.');
  if (previous?.birthDate === birthDate) throw Error('Choose a different date of birth.');
  const item = { id: randomUUID(), uid: who.uid, name: who.name, organizerUid, previousBirthDate: previous?.birthDate ?? null, birthDate, phoneNumber: previous?.phoneNumber ?? phoneNumber ?? '', status: 'pending', createdAt: new Date().toISOString() };
  state.ageRequests.push(item);
  notice(state, organizerUid, 'Birth-date approval needed', who.name + ' requested a date-of-birth change. Review it in Your family.');
  Object.keys(state.guardians).filter(uid => state.guardians[uid] === organizerUid).forEach(uid => notice(state, uid, 'Birth-date approval needed', who.name + ' requested a date-of-birth change. Review it in Your family.'));
  return item;
}
export function reviewAgeChange(state, who, id, approve) {
  const item = state.ageRequests.find(value => value.id === id);
  if (!item || item.status !== 'pending' || typeof approve !== 'boolean' || state.memberships[item.uid] !== item.organizerUid) throw Error('This request is no longer available.');
  if (who.uid !== item.organizerUid && state.guardians[who.uid] !== item.organizerUid) throw Error('Only the organizer or a Parent/Guardian can review this request.');
  if (approve) {
    const person = state.profiles[item.uid];
    const previous = person.account ?? { phoneNumber: item.phoneNumber, ageVerification: 'self-declared', phoneVerification: 'unverified', guardianStatus: 'not-linked' };
    const age = ageOf(item.birthDate);
    person.account = { ...previous, birthDate: item.birthDate, accountType: age < 18 ? 'minor' : 'adult' };
  }
  item.status = approve ? 'approved' : 'declined'; item.reviewedBy = who.uid;
  notice(state, item.uid, approve ? 'Birth date updated' : 'Birth-date change declined', approve ? 'Your family approved the new date of birth.' : 'Your date of birth has not changed.');
}
export function setGuardian(state, who, uid, enabled) {
  if (state.memberships[who.uid] || state.memberships[uid] !== who.uid || uid === who.uid || typeof enabled !== 'boolean') throw Error('Only the original organizer can change Parent/Guardian permissions.');
  const person = state.profiles[uid];
  if (enabled && (!person?.account || isMinor(person.account.birthDate))) throw Error('A Parent/Guardian must have an adult date of birth on their account.');
  if (enabled) state.guardians[uid] = who.uid; else delete state.guardians[uid];
  notice(state, uid, enabled ? 'Parent/Guardian access granted' : 'Parent/Guardian access removed', enabled ? 'You can review minors’ driving summaries and birth-date requests. Membership and role changes remain with the original organizer.' : 'You remain a member, but can no longer manage minors.');
}
export function removeMember(state, who, uid) {
  if (state.memberships[who.uid] || state.memberships[uid] !== who.uid || uid === who.uid) throw Error('Only the original organizer can remove members.');
  leave(state, { uid, name: state.profiles[uid]?.name ?? 'Member' });
  notice(state, uid, 'Removed from family', who.name + ' removed you from the family. Shared drive access has ended.');
}
export function submitFeedback(state, who, input) {
  if (!['bug', 'feedback'].includes(input.kind) || typeof input.subject !== 'string' || input.subject.trim().length < 3 || input.subject.length > 160 || typeof input.message !== 'string' || input.message.trim().length < 10 || input.message.length > 4000) throw Error('Add a short subject and at least 10 characters describing the issue.');
  const now = Date.now();
  if (state.feedback.filter(item => item.uid === who.uid && now - Date.parse(item.createdAt) < 3600000).length >= 5) throw Error('Please wait before sending more feedback.');
  const item = { id: randomUUID(), uid: who.uid, kind: input.kind, subject: input.subject.trim(), message: input.message.trim(), platform: String(input.platform ?? '').slice(0, 20), emailDelivery: 'not-configured', createdAt: new Date().toISOString() };
  state.feedback.push(item); return item;
}
