export type PairKind = 'family' | 'friend';

export function connectionPairId(kind: PairKind, firstUid: string, secondUid: string) {
  if (!firstUid || !secondUid || firstUid === secondUid || firstUid.includes('/') || secondUid.includes('/')) throw Error('A connection needs two different valid accounts.');
  const [first, second] = firstUid < secondUid ? [firstUid, secondUid] : [secondUid, firstUid];
  return `${kind}_${first}_${second}`;
}

type PairRecord = { id: string; kind: PairKind; ownerUid: string; memberUid: string; updatedAt?: { toMillis?: () => number } | null; createdAt?: { toMillis?: () => number } | null };

function recordTime(item: PairRecord) {
  return item.updatedAt?.toMillis?.() ?? item.createdAt?.toMillis?.() ?? 0;
}

/** Keep the newest record while older clients are migrated away from random IDs. */
export function dedupeConnections<T extends PairRecord>(items: T[]) {
  const latest = new Map<string, T>();
  for (const item of items) {
    const key = connectionPairId(item.kind, item.ownerUid, item.memberUid);
    const current = latest.get(key);
    if (!current || recordTime(item) > recordTime(current) || (recordTime(item) === recordTime(current) && item.id === key)) latest.set(key, item);
  }
  return [...latest.values()];
}

