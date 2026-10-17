import { accountKey, type LocalStore } from './localState';

export function startupKeys(uid: string, model: string) {
  const prefix = accountKey(uid) + ':model:' + model;
  return { ready: prefix + ':ready', loading: prefix + ':loading' };
}
export function startupState(store: LocalStore, uid: string, model: string) {
  const keys = startupKeys(uid, model);
  return { configured: store.getItem(keys.ready) === 'yes', interruptedLoad: store.getItem(keys.loading) === 'yes' };
}
