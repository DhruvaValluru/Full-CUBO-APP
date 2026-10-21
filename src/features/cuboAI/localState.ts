// Browser persistence is the offline source. Bounded text state is mirrored to the signed-in
// account by CuboAIScreen; models, raw audio and transient recovery drafts stay device-local.
export const WEEKLY_REPLIES = 100;
export type ChatMessage = { role: 'user' | 'assistant'; content: string; at: number; source: 'text' | 'voice' };
export type LocalAIState = { version: 1; owner: string; week: number; used: number; memory: string; messages: ChatMessage[] };
export type LocalStore = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;
export function weekStart(now: number) {
  const date = new Date(now);
  date.setUTCHours(0, 0, 0, 0);
  date.setUTCDate(date.getUTCDate() - (date.getUTCDay() + 6) % 7);
  return date.getTime();
}
export function accountKey(uid: string) {
  if (!uid.trim()) throw Error('Sign in to use Cubo Assistant.');
  return `cubo-ai:v1:${encodeURIComponent(uid)}`;
}
export function readState(store: LocalStore, uid: string, now = Date.now()): LocalAIState {
  const raw = store.getItem(accountKey(uid)); // Storage failures must be visible, not silently erase history.
  const empty: LocalAIState = { version: 1, owner: uid, week: weekStart(now), used: 0, memory: '', messages: [] };
  if (!raw) return empty;
  let data: LocalAIState;
  try { data = JSON.parse(raw); } catch { throw Error('Cubo Assistant history could not be read. Open Cubo Assistant settings to clear this account’s local history.'); }
  if (data.version !== 1 || data.owner !== uid || !Number.isFinite(data.week) || !Number.isInteger(data.used) || data.used < 0 || typeof data.memory !== 'string' || data.memory.length > 2000 || !Array.isArray(data.messages) || data.messages.length > 200 || data.messages.some(m => !m || !['user', 'assistant'].includes(m.role) || !['text', 'voice'].includes(m.source) || typeof m.content !== 'string' || m.content.length > 8000 || !Number.isFinite(m.at))) throw Error('Cubo Assistant local data is invalid. No history was loaded.');
  // Do not reset on clock rollback. A device-local allowance is still intentionally bypassable.
  return weekStart(now) > data.week ? { ...data, week: weekStart(now), used: 0 } : data;
}
export function writeState(store: LocalStore, state: LocalAIState) {
  store.setItem(accountKey(state.owner), JSON.stringify(state));
}

// Explicit confirmed recovery only; never grant fresh allowance on corrupt data.
export function clearAccountState(store: LocalStore, uid: string, now = Date.now()) {
  let week = weekStart(now), used = WEEKLY_REPLIES;
  try { const previous = readState(store, uid, now); week = previous.week; used = previous.used; }
  catch { /* Unreadable allowance stays exhausted until next week. */ }
  const state: LocalAIState = { version: 1, owner: uid, week, used, memory: '', messages: [] };
  writeState(store, state);
  return state;
}
