export function usageBadge(used: number) {
  const percent = Math.max(0, Math.min(100, 100 - used));
  return { percent, background: percent <= 20 ? '#BD2929' : percent <= 60 ? '#F0CC51' : percent <= 80 ? '#D87920' : '#137858', foreground: percent > 20 && percent <= 80 ? '#231B0B' : '#FFFFFF' };
}
export function drivingContext(trips: { endedAt?: string; focusScore: number; attentionMeasured?: boolean; distanceMiles: number; durationSeconds: number }[]) {
  const completed = trips.filter(t => t.endedAt);
  const measured = completed.filter(t => t.attentionMeasured && Number.isFinite(t.focusScore));
  return `Current account's saved completed trips: ${completed.length}. CUBO safety score: ${measured.length ? Math.round(measured.reduce((sum, t) => sum + t.focusScore, 0) / measured.length) + '/100 across ' + measured.length + ' measured trips' : '100/100 starter score; no measured completed trips yet'}. Saved distance: ${completed.reduce((sum, t) => sum + (Number.isFinite(t.distanceMiles) ? t.distanceMiles : 0), 0).toFixed(1)} miles. These are device-saved summaries, not real-time signals or validated safety ratings. No unshared family or friend data is supplied.`;
}
