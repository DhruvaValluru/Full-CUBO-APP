export function formatDuration(seconds: number) {
  const total = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(total / 60);
  return minutes ? `${minutes}m ${total % 60}s` : `${total}s`;
}
export function elapsedSeconds(startedAt: string, now = Date.now()) {
  const start = new Date(startedAt).getTime();
  return Number.isFinite(start) ? Math.max(0, Math.floor((now - start) / 1000)) : 0;
}

