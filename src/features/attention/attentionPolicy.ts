export type FaceSample = { at: number; face: boolean; yaw: number; pitch: number; eyes: number; width: number; x: number; y: number };
export type AttentionBaseline = { yaw: number; pitch: number; eyes: number; version: 1 };
export type AttentionKind = 'looking_away' | 'eyes_closed';
export type AttentionState = { lastAt: number; since: number; kind: AttentionKind | null; emitted: boolean; measuredMs: number; attentiveMs: number };
export const emptyAttention = (): AttentionState => ({ lastAt: 0, since: 0, kind: null, emitted: false, measuredMs: 0, attentiveMs: 0 });

// Pure, dependency-free: also serialized into the native, on-device WebView.
export function faceMetrics(points: { x: number; y: number }[] | undefined, aspect = 1): Omit<FaceSample, 'at'> {
  const missing = { face: false, yaw: 0, pitch: 0, eyes: 0, width: 0, x: 0, y: 0 };
  if (!points || points.length < 455) return missing;
  const distance = (a: number, b: number) => Math.hypot((points[a].x - points[b].x) * aspect, points[a].y - points[b].y);
  const left = points[234], right = points[454], nose = points[1];
  const width = Math.abs(right.x - left.x);
  if (width < .08) return missing;
  const eyes = ((distance(159, 145) / Math.max(.001, distance(33, 133))) + (distance(386, 374) / Math.max(.001, distance(362, 263)))) / 2;
  const result = { face: true, yaw: (nose.x - (left.x + right.x) / 2) / width, pitch: (nose.y - (left.y + right.y) / 2) / (width * aspect), eyes, width, x: (left.x + right.x) / 2, y: (left.y + right.y) / 2 };
  return Object.values(result).every(v => typeof v !== 'number' || Number.isFinite(v)) ? result : missing;
}

export function calibrate(samples: FaceSample[]): AttentionBaseline {
  if (samples.length < 8 || samples[samples.length - 1].at - samples[0].at < 3000) throw Error('Keep looking ahead with your eyes open for a few more seconds.');
  if (samples.some((s, i) => !s.face || s.width < .14 || s.width > .8 || s.x < .2 || s.x > .8 || s.y < .15 || s.y > .85 || s.eyes < .16 || (i > 0 && (s.at <= samples[i - 1].at || s.at - samples[i - 1].at > 1500)))) throw Error('Keep one face visible, eyes open, and the camera steady. Try again while parked.');
  const range = (key: 'yaw' | 'pitch') => Math.max(...samples.map(s => s[key])) - Math.min(...samples.map(s => s[key]));
  if (range('yaw') > .12 || range('pitch') > .12) throw Error('The camera or your head moved. Look at the road ahead and try again while parked.');
  const average = (key: 'yaw' | 'pitch' | 'eyes') => samples.reduce((sum, s) => sum + s[key], 0) / samples.length;
  return { version: 1, yaw: average('yaw'), pitch: average('pitch'), eyes: average('eyes') };
}

export function advanceAttention(previous: AttentionState, sample: FaceSample, baseline: AttentionBaseline | null, moving: boolean) {
  const gap = sample.at - previous.lastAt;
  const valid = Boolean(baseline && sample.face && moving && sample.width >= .08);
  if (!valid) return { state: { ...previous, lastAt: 0, since: 0, kind: null, emitted: false }, event: null, status: !baseline ? 'Calibrate camera before monitoring' : !moving ? 'Monitoring paused · stationary / GPS unavailable' : 'Monitoring unavailable · face not visible' };
  const kind: AttentionKind | null = sample.eyes < baseline!.eyes * .55 ? 'eyes_closed' : Math.abs(sample.yaw - baseline!.yaw) > .16 || Math.abs(sample.pitch - baseline!.pitch) > .18 ? 'looking_away' : null;
  const continuous = previous.lastAt > 0 && gap > 0 && gap <= 1500;
  const since = continuous && kind === previous.kind ? previous.since : sample.at;
  const duration = kind ? sample.at - since : 0;
  const sustained = duration >= (kind === 'eyes_closed' ? 1800 : 2200);
  const emitted = continuous && kind === previous.kind && previous.emitted;
  const delta = continuous ? gap : 0;
  const state: AttentionState = { lastAt: sample.at, since, kind, emitted: emitted || sustained, measuredMs: previous.measuredMs + delta, attentiveMs: previous.attentiveMs + (kind ? 0 : delta) };
  return { state, event: kind && sustained && !emitted ? { kind, duration } : null, status: sustained ? kind === 'eyes_closed' ? 'Eyes closed · take a safe break' : 'Look at the road ahead' : 'Attention monitoring active · experimental' };
}
