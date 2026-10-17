import { advanceAttention, calibrate, emptyAttention, type AttentionBaseline, type AttentionState, type FaceSample } from '../attention/attentionPolicy';

export type CalibrationPhase = 'position' | 'baseline' | 'ready' | 'away' | 'return' | 'confirm';
export type CalibrationTest = {
  phase: CalibrationPhase; startedAt: number; lastAt: number;
  samples: FaceSample[]; baseline: AttentionBaseline | null;
  attention: AttentionState; forwardSince: number; progress: number; hint: string;
};
export const newCalibrationTest = (): CalibrationTest => ({
  phase: 'position', startedAt: 0, lastAt: 0, samples: [], baseline: null,
  attention: emptyAttention(), forwardSince: 0, progress: 0, hint: '',
});
export function beginBaseline(now: number): CalibrationTest {
  return { ...newCalibrationTest(), phase: 'baseline', startedAt: now };
}
export function beginLookAway(state: CalibrationTest, now: number): CalibrationTest {
  if (!state.baseline || !['ready', 'confirm'].includes(state.phase)) return state;
  return { ...state, phase: 'away', startedAt: now, lastAt: 0, attention: emptyAttention(), forwardSince: 0, progress: 0, hint: '' };
}
export function freshFace(sample: FaceSample, now: number) {
  return sample.face && sample.width >= .08 && now >= sample.at && now - sample.at <= 1500
    && [sample.at, sample.yaw, sample.pitch, sample.eyes, sample.width, sample.x, sample.y].every(Number.isFinite);
}
export function advanceCalibrationTest(previous: CalibrationTest, sample: FaceSample, now: number): { state: CalibrationTest; alert: boolean } {
  const quiet = (state: CalibrationTest) => ({ state, alert: false });
  if (!['baseline', 'away', 'return'].includes(previous.phase)) return quiet(previous);
  if (sample.at < previous.startedAt || sample.at <= previous.lastAt) return quiet(previous);
  let state = { ...previous, lastAt: sample.at };
  if (!freshFace(sample, now)) {
    return quiet({ ...state, lastAt: 0, samples: state.phase === 'baseline' ? [] : state.samples,
      attention: emptyAttention(), forwardSince: 0, progress: 0,
      hint: 'Keep your face in view. Move a little closer or improve the lighting.' });
  }
  if (state.phase === 'baseline') {
    const framed = sample.width >= .14 && sample.width <= .8 && sample.x >= .2 && sample.x <= .8 && sample.y >= .15 && sample.y <= .85 && sample.eyes >= .16;
    if (!framed) return quiet({ ...state, samples: [], progress: 0, hint: 'Keep your face centered, eyes open, and phone steady.' });
    const last = state.samples.at(-1);
    let samples = last && sample.at - last.at <= 1500 ? [...state.samples, sample] : [sample];
    const steady = (key: 'yaw' | 'pitch') => Math.max(...samples.map(s => s[key])) - Math.min(...samples.map(s => s[key])) <= .12;
    if (!steady('yaw') || !steady('pitch')) samples = [sample];
    const elapsed = sample.at - samples[0].at;
    state = { ...state, samples, progress: Math.min(1, elapsed / 3000, samples.length / 8), hint: 'Look ahead with your eyes open. Hold still for 3 seconds.' };
    if (elapsed >= 3000 && samples.length >= 8) {
      try { return quiet({ ...state, baseline: calibrate(samples), phase: 'ready', progress: 1, hint: '' }); }
      catch { return quiet({ ...state, samples: [sample], progress: 0 }); }
    }
    return quiet(state);
  }
  // Calibration-only sandbox: use the exact drive detector and dwell thresholds,
  // without GPS/movement gating. This state never enters DriveContext or trip scores.
  const result = advanceAttention(state.attention, sample, state.baseline, true, true);
  state = { ...state, attention: result.state, hint: '' };
  if (state.phase === 'away') {
    if (result.event?.kind === 'looking_away') {
      return { state: { ...state, phase: 'return', startedAt: now, forwardSince: 0, progress: 0 }, alert: true };
    }
    const lookingAway = result.state.kind === 'looking_away';
    return quiet({ ...state, progress: lookingAway ? Math.min(1, (sample.at - result.state.since) / 2200) : 0,
      hint: lookingAway ? 'Head turn detected. Hold briefly until you hear the alert.' : 'Turn your head slightly to either side; keep your eyes open and face visible.' });
  }
  const continuous = previous.lastAt > 0 && sample.at - previous.lastAt <= 1500;
  const forwardSince = result.state.kind === null ? continuous && state.forwardSince ? state.forwardSince : sample.at : 0;
  const duration = forwardSince ? sample.at - forwardSince : 0;
  return quiet({ ...state, forwardSince, progress: Math.min(1, duration / 1200),
    phase: duration >= 1200 ? 'confirm' : 'return',
    hint: result.state.kind === null ? 'Forward-facing again. Hold for a moment.' : 'Look forward again with your eyes open.' });
}
export function calibrationTimeout(state: CalibrationTest, now: number): CalibrationTest {
  if (!['baseline', 'away', 'return'].includes(state.phase) || now - state.startedAt < 30000) return state;
  return { ...newCalibrationTest(), hint: 'Test timed out. Check the camera framing and lighting, then begin again while parked.' };
}
