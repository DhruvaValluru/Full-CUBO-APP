import http from 'node:http';
import { readFile, writeFile, mkdir, rename } from 'node:fs/promises';
import { resolve } from 'node:path';
import { freshState, register, snapshot, invite, respond, leave, notice, canReadDrives, sanitizeDrive, updateAccount, requestAgeChange, reviewAgeChange, setGuardian, removeMember, submitFeedback } from './domain.mjs';

const apiKey = process.env.FIREBASE_WEB_API_KEY;
if (!apiKey) throw Error('Set FIREBASE_WEB_API_KEY to the app’s Firebase web API key.');
const directory = resolve(process.env.CUBO_FAMILY_DATA_DIR ?? '.local-family');
await mkdir(directory, { recursive: true });
const file = resolve(directory, 'state.json');
let state;
try { state = JSON.parse(await readFile(file, 'utf8')); } catch (error) { if (error.code !== 'ENOENT') throw error; state = freshState(); }
let queue = Promise.resolve();
async function save() { await writeFile(file + '.tmp', JSON.stringify(state)); await rename(file + '.tmp', file); }
async function identity(request) {
  const token = request.headers.authorization?.match(/^Bearer (.+)$/)?.[1];
  if (!token) throw Error('Sign in first.');
  const result = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(apiKey)}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ idToken: token }), signal: AbortSignal.timeout(10000) });
  const payload = await result.json(); const user = payload.users?.[0];
  if (!result.ok || !user?.localId || !user.email) throw Error('Sign-in expired. Sign in again.');
  return { uid: user.localId, email: user.email.toLowerCase(), name: user.displayName ?? user.email.split('@')[0], emailVerified: user.emailVerified === true };
}
async function body(request) {
  let value = ''; for await (const chunk of request) { value += chunk; if (Buffer.byteLength(value) > 65536) throw Error('Request too large.'); }
  return value ? JSON.parse(value) : {};
}
async function sendInvitation(item) {
  if (!process.env.RESEND_API_KEY || !process.env.CUBO_EMAIL_FROM || !process.env.CUBO_APP_URL) return;
  const link = `${process.env.CUBO_APP_URL.replace(/\/$/, '')}/?familyInvite=${encodeURIComponent(item.id)}`;
  const response = await fetch('https://api.resend.com/emails', { method: 'POST', headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ from: process.env.CUBO_EMAIL_FROM, to: [item.recipientEmail], subject: 'Your CUBO family invitation', text: `${item.organizerName} invited you to join their CUBO family. Only accept if you know this person. Joining shares driving summaries, never camera footage. You can leave at any time. Open CUBO to review: ${link}` }), signal: AbortSignal.timeout(10000) });
  if (response.ok) item.emailDelivery = 'sent';
}
const server = http.createServer(async (request, response) => {
  // Browser access is limited to the configured app origin; mobile clients use Firebase tokens.
  if (request.headers.origin) {
    if (request.headers.origin !== (process.env.CUBO_APP_ORIGIN ?? 'http://localhost:8081')) { response.writeHead(403); response.end(); return; }
    response.setHeader('Access-Control-Allow-Origin', request.headers.origin); response.setHeader('Vary', 'Origin');
  }
  response.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type'); response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS'); response.setHeader('Cache-Control', 'no-store');
  if (request.method === 'OPTIONS') { response.writeHead(204); response.end(); return; }
  if (request.url === '/health') { response.setHeader('Content-Type', 'application/json'); response.end(JSON.stringify({ ok: true, emailConfigured: !!process.env.RESEND_API_KEY })); return; }
  try {
    const who = await identity(request); const input = request.method === 'POST' ? await body(request) : {};
    const path = new URL(request.url, 'http://localhost').pathname;
    const job = async () => {
      register(state, who); let result; const memberPath = path.match(/^\/family\/member\/([^/]+)\/drives$/);
      if (request.method === 'GET' && memberPath) { const owner = decodeURIComponent(memberPath[1]); if (!canReadDrives(state, who.uid, owner)) throw Error('This member has not consented to share drives with you.'); result = state.drives[owner] ?? []; }
      else if (request.method === 'GET' && path === '/family') result = snapshot(state, who);
      else if (request.method === 'POST' && path === '/family/invite') { const item = invite(state, who, input.email); try { await sendInvitation(item); } catch { /* Pending in-app invitation survives an email outage. */ } result = snapshot(state, who); }
      else if (request.method === 'POST' && path === '/family/respond') { respond(state, who, input.id, input.accept); result = snapshot(state, who); }
      else if (request.method === 'POST' && path === '/family/leave') { leave(state, who); result = snapshot(state, who); }
      else if (request.method === 'POST' && path === '/account/details') { updateAccount(state, who, input); result = snapshot(state, who); }
      else if (request.method === 'POST' && path === '/family/age/request') { requestAgeChange(state, who, input.birthDate, input.phoneNumber); result = snapshot(state, who); }
      else if (request.method === 'POST' && path === '/family/age/review') { reviewAgeChange(state, who, input.id, input.approve); result = snapshot(state, who); }
      else if (request.method === 'POST' && path === '/family/guardian') { setGuardian(state, who, input.uid, input.enabled); result = snapshot(state, who); }
      else if (request.method === 'POST' && path === '/family/remove') { removeMember(state, who, input.uid); result = snapshot(state, who); }
      else if (request.method === 'POST' && path === '/support/feedback') { const item = submitFeedback(state, who, input); await sendFeedback(item); result = { id: item.id, emailDelivery: item.emailDelivery }; }
      else if (request.method === 'POST' && path === '/notifications/read') { (state.notifications[who.uid] ?? []).forEach(item => { item.read = true; }); result = snapshot(state, who); }
      else if (request.method === 'POST' && path === '/family/drives') {
        const organizer = state.memberships[who.uid]; if (!organizer) throw Error('Join a family before sharing driving summaries.');
        if (!Array.isArray(input.drives) || input.drives.length > 50) throw Error('Invalid drive list.');
        const drives = input.drives.map(sanitizeDrive); const previous = new Set((state.drives[who.uid] ?? []).map(item => item.id)); state.drives[who.uid] = drives;
        drives.filter(item => !previous.has(item.id)).slice(0, 1).forEach(item => notice(state, organizer, 'Drive completed', `${who.name} completed a drive in ${item.vehicleName}.`)); result = { ok: true };
      } else throw Error('Unknown family request.');
      await save(); return result;
    };
    const promise = queue.then(job); queue = promise.catch(() => {}); const result = await promise;
    response.writeHead(200, { 'Content-Type': 'application/json' }); response.end(JSON.stringify(result));
  } catch (error) { response.writeHead(400, { 'Content-Type': 'application/json' }); response.end(JSON.stringify({ error: error.message })); }
});
server.listen(Number(process.env.PORT ?? 8082), process.env.CUBO_HOST ?? '127.0.0.1', () => console.log('CUBO family server ready. Email delivery is optional and must be configured explicitly.'));

async function sendFeedback(item) {
  // Opt-in delivery adapter. Until all three variables exist, nothing is emailed.
  if (!process.env.RESEND_API_KEY || !process.env.CUBO_EMAIL_FROM || !process.env.CUBO_TEAM_EMAIL) return;
  try {
    const result = await fetch('https://api.resend.com/emails', { method: 'POST', headers: { Authorization: 'Bearer ' + process.env.RESEND_API_KEY, 'Content-Type': 'application/json' }, body: JSON.stringify({ from: process.env.CUBO_EMAIL_FROM, to: [process.env.CUBO_TEAM_EMAIL], subject: '[CUBO ' + item.kind + '] ' + item.subject, text: item.message + '\n\nPlatform: ' + item.platform + '\nReference: ' + item.id }), signal: AbortSignal.timeout(10000) });
    if (result.ok) item.emailDelivery = 'sent'; else item.emailDelivery = 'failed';
  } catch { item.emailDelivery = 'failed'; }
}
