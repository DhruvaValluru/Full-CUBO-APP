export type MediaKind = 'camera' | 'microphone';
export const accessHelp = 'If blocked, open this website’s settings in your browser and allow Camera or Microphone, then retry. On iPhone Safari, use the page menu → website settings. The browser controls whether access is remembered. Speech recognition can require separate Apple/browser consent.';
export const openAccessSettings: (() => Promise<void>) | undefined = undefined;
export async function checkMediaAccess(kind: MediaKind): Promise<string> {
  if (!globalThis.isSecureContext || !navigator.mediaDevices?.getUserMedia) return 'Unavailable · HTTPS browser required';
  try {
    const result = await navigator.permissions.query({ name: kind as PermissionName });
    return result.state === 'granted' ? 'Allowed' : result.state === 'denied' ? 'Blocked · check site settings' : 'Ask when needed';
  } catch { return 'Browser manages access'; }
}
/** A grant check briefly opens only the requested device, then releases every track. */
export async function requestMediaAccess(kind: MediaKind): Promise<string> {
  if (!globalThis.isSecureContext || !navigator.mediaDevices?.getUserMedia) throw Error('Use the HTTPS CUBO website in a supported browser.');
  const stream = await navigator.mediaDevices.getUserMedia({ audio: kind === 'microphone', video: kind === 'camera' });
  try { return 'Allowed just now · check finished'; }
  finally { stream.getTracks().forEach(track => track.stop()); }
}
