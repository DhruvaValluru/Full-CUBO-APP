type Store = { getItem(key: string): string | null; setItem(key: string, value: string): void };
/** Only the last consented trip ID, scoped to this account/tab; never auto-enables audio. */
export function driveConsent(store: Store | undefined, uid: string, tripId: string) {
  const key = `cubo-drive-voice-consent-v2:${uid}`;
  let accepted = false;
  try { accepted = store?.getItem(key) === tripId; } catch { /* In-memory consent still works. */ }
  return {
    accepted: () => accepted,
    accept: () => { accepted = true; try { store?.setItem(key, tripId); } catch { /* Blocked storage. */ } },
  };
}
