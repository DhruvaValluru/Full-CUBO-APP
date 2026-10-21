import { test } from 'node:test';
import assert from 'node:assert/strict';
import { freshState, register, invite, respond, leave, canReadDrives, snapshot, sanitizeDrive, updateAccount, setGuardian, removeMember, requestAgeChange, reviewAgeChange, submitFeedback } from './domain.mjs';
const parent = { uid: 'parent', email: 'parent@example.com', name: 'Parent', emailVerified: true };
const child = { uid: 'child', email: 'child@example.com', name: 'Child', emailVerified: true };
test('family access requires approval and is revoked immediately on leaving', () => {
  const state = freshState(); register(state, parent); updateAccount(state, parent, { birthDate: '1980-01-01', phoneNumber: '+19195550123' }); register(state, child);
  const pending = invite(state, parent, child.email);
  assert.equal(canReadDrives(state, parent.uid, child.uid), false);
  assert.throws(() => respond(state, parent, pending.id, true));
  assert.throws(() => respond(state, { ...child, emailVerified: false }, pending.id, true));
  respond(state, child, pending.id, true);
  assert.equal(canReadDrives(state, parent.uid, child.uid), true);
  assert.equal(canReadDrives(state, 'stranger', child.uid), false);
  assert.equal(snapshot(state, child).members.length, 2);
  leave(state, child);
  assert.equal(canReadDrives(state, parent.uid, child.uid), false);
  assert.equal(snapshot(state, parent).notifications[0].title, 'Family member left');
});
test('summaries exclude private routes and camera footage', () => {
  const safe = sanitizeDrive({ id: 'trip1', endedAt: new Date().toISOString(), vehicleName: 'Prius', durationSeconds: 10, distanceMiles: 0, alertCount: 0, focusScore: null, route: [{ latitude: 35 }], camera: 'private' });
  assert.equal('route' in safe, false); assert.equal('camera' in safe, false);
  assert.throws(() => sanitizeDrive({ ...safe, focusScore: 101 }));
});
test('new recipients discover pending invitations without exposing other accounts', () => {
  const state = freshState(); register(state, parent);
  updateAccount(state, parent, { birthDate: '1980-01-01', phoneNumber: '+19195550123' });
  invite(state, parent, child.email);
  register(state, child); register(state, child);
  assert.equal(snapshot(state, child).invitations.length, 1);
  assert.equal(snapshot(state, child).notifications.length, 1);
  assert.equal(snapshot(state, { ...child, uid: 'other', email: 'other@example.com' }).invitations.length, 0);
  assert.throws(() => invite(state, { ...parent, emailVerified: false }, 'next@example.com'));
});

function linkedFamily() {
  const state = freshState(); register(state, parent); register(state, child);
  updateAccount(state, parent, { birthDate: '1980-01-01', phoneNumber: '+19195550123' });
  updateAccount(state, child, { birthDate: '2010-01-01', phoneNumber: '+19195550124' });
  respond(state, child, invite(state, parent, child.email).id, true);
  const spouse = { uid: 'spouse', email: 'spouse@example.com', name: 'Spouse', emailVerified: true };
  register(state, spouse); updateAccount(state, spouse, { birthDate: '1982-03-01', phoneNumber: '+19195550125' });
  respond(state, spouse, invite(state, parent, spouse.email).id, true);
  return { state, spouse };
}
test('Parent/Guardian may review minors but cannot promote or remove members', () => {
  const { state, spouse } = linkedFamily();
  assert.equal(canReadDrives(state, spouse.uid, child.uid), false);
  setGuardian(state, parent, spouse.uid, true);
  assert.equal(snapshot(state, spouse).members.find(item => item.uid === spouse.uid).role, 'guardian');
  assert.equal(canReadDrives(state, spouse.uid, child.uid), true);
  assert.equal(canReadDrives(state, spouse.uid, parent.uid), false);
  assert.throws(() => setGuardian(state, spouse, child.uid, true));
  assert.throws(() => removeMember(state, spouse, child.uid));
  assert.throws(() => setGuardian(state, parent, child.uid, true));
  setGuardian(state, parent, spouse.uid, false);
  assert.equal(canReadDrives(state, spouse.uid, child.uid), false);
});
test('linked minor birthday cannot bypass review through account editing', () => {
  const { state, spouse } = linkedFamily();
  assert.throws(() => updateAccount(state, child, { birthDate: '1990-01-01', phoneNumber: '+19195550124' }));
  const request = requestAgeChange(state, child, '2007-01-01');
  assert.equal(state.profiles[child.uid].account.birthDate, '2010-01-01');
  assert.throws(() => reviewAgeChange(state, child, request.id, true));
  assert.throws(() => reviewAgeChange(state, spouse, request.id, true));
  reviewAgeChange(state, parent, request.id, true);
  assert.equal(state.profiles[child.uid].account.accountType, 'adult');
  assert.throws(() => reviewAgeChange(state, parent, request.id, true));
});
test('original organizer removal immediately revokes guardian access and requests', () => {
  const { state, spouse } = linkedFamily(); setGuardian(state, parent, spouse.uid, true);
  const request = requestAgeChange(state, child, '2011-01-01');
  removeMember(state, parent, child.uid);
  assert.equal(canReadDrives(state, spouse.uid, child.uid), false);
  assert.throws(() => reviewAgeChange(state, parent, request.id, true));
});
test('family snapshot does not expose other members phone numbers or dates of birth', () => {
  const { state } = linkedFamily();
  const value = snapshot(state, parent);
  assert.equal(value.members.some(item => 'account' in item), false);
  assert.equal(value.account.birthDate, '1980-01-01');
});
test('account phone number is optional but invalid non-empty values are rejected', () => {
  const state = freshState(); register(state, parent);
  assert.equal(updateAccount(state, parent, { birthDate: '1980-01-01', phoneNumber: '' }).phoneNumber, '');
  assert.throws(() => updateAccount(state, parent, { birthDate: '1980-01-01', phoneNumber: '9195550123' }));
});
test('feedback stays queued until provider configuration, validates lengths and rate limits', () => {
  const { state } = linkedFamily();
  assert.throws(() => submitFeedback(state, parent, { kind: 'bug', subject: 'x', message: 'short' }));
  const input = { kind: 'bug', subject: 'Camera preview', message: 'Preview did not appear after continuing.', platform: 'ios' };
  for (let index = 0; index < 5; index++) assert.equal(submitFeedback(state, parent, input).emailDelivery, 'not-configured');
  assert.throws(() => submitFeedback(state, parent, input));
});
test('a linked legacy account with no birthday needs parent approval, never an adult self-seed', () => {
  const { state } = linkedFamily(); delete state.profiles[child.uid].account;
  assert.throws(() => updateAccount(state, child, { birthDate: '1990-01-01', phoneNumber: '+19195550124' }));
  const request = requestAgeChange(state, child, '2010-01-01', '+19195550124');
  assert.equal(state.profiles[child.uid].account, undefined);
  assert.equal('phoneNumber' in snapshot(state, parent).ageRequests[0], false);
  reviewAgeChange(state, parent, request.id, true);
  assert.equal(state.profiles[child.uid].account.accountType, 'minor');
});
test('guardian birthday edits cannot retain adult privileges on a minor account', () => {
  const { state, spouse } = linkedFamily(); setGuardian(state, parent, spouse.uid, true);
  assert.throws(() => updateAccount(state, spouse, { birthDate: '2010-01-01', phoneNumber: '+19195550125' }));
});
