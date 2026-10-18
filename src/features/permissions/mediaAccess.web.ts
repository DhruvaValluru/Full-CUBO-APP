export type MediaKind = 'camera' | 'microphone' | 'location';
export const accessHelp = 'If blocked, open this website’s settings in your browser and allow Camera, Microphone or Location, then retry. On iPhone, also check Settings → Privacy & Security → Location Services if needed. The browser controls whether access is remembered. Speech recognition can require separate Apple/browser consent.';
const verified = new Set<MediaKind>();
export const openAccessSettings: (() => Promise<void>) | undefined = undefined;
export async function checkMediaAccess(kind: MediaKind): Promise<string> {
  if (!globalThis.isSecureContext || (kind === 'location' ? !navigator.geolocation : !navigator.mediaDevices?.getUserMedia)) return 'Unavailable · HTTPS browser required';
  try {
    const result = await navigator.permissions.query({ name: (kind === 'location' ? 'geolocation' : kind) as PermissionName });
    return result.state === 'granted' ? 'Allowed' : result.state === 'denied' ? 'Blocked · check site settings' : 'Ask when needed';
  } catch { return verified.has(kind) ? 'Verified this session · browser manages permission' : 'Not checked · tap Allow to verify'; }
}
/** A grant check briefly opens only the requested device, then releases every track. */
export async function requestMediaAccess(kind: MediaKind, signal?: AbortSignal): Promise<string> {
  if (kind === 'location') return requestLocationAccess(signal);
  if (!globalThis.isSecureContext || !navigator.mediaDevices?.getUserMedia) throw Error('Use the HTTPS CUBO website in a supported browser.');
  if (signal?.aborted) throw new DOMException('Check cancelled', 'AbortError');
  return new Promise<string>((resolve, reject) => {
    let settled = false;
    const finish = (error?: unknown) => {
      if (settled) return;
      settled = true; clearTimeout(timer); signal?.removeEventListener('abort', cancel);
      if (error) reject(error);
      else { verified.add(kind); resolve('Allowed just now · check finished'); }
    };
    const cancel = () => finish(new Error('Check cancelled. Any late permission grant will immediately release the device.'));
    const timer = setTimeout(() => finish(new Error('No permission response yet. Allow access in the browser prompt or website settings, then retry.')), 20000);
    signal?.addEventListener('abort', cancel, { once: true });
    // Invoke directly from the tap. A browser prompt cannot be dismissed by code,
    // so always release tracks even if it resolves after cancellation or timeout.
    try {
      navigator.mediaDevices.getUserMedia({ audio: kind === 'microphone', video: kind === 'camera' }).then(stream => {
        stream.getTracks().forEach(track => track.stop());
        finish();
      }, error => { verified.delete(kind); finish(error); });
    } catch (error) { finish(error); }
  });
}

/** Discard the position and stop the watch on every exit; never persist coordinates. */
async function requestLocationAccess(signal?: AbortSignal): Promise<string> {
  if (!globalThis.isSecureContext || !navigator.geolocation) throw Error('Use the HTTPS CUBO website in a browser with location support.');
  if (signal?.aborted) throw Error('Location check cancelled.');
  return new Promise<string>((resolve, reject) => {
    let settled = false;
    let watchId: number | undefined;
    const finish = (error?: Error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      signal?.removeEventListener('abort', cancel);
      if (watchId !== undefined) navigator.geolocation.clearWatch(watchId);
      if (error) { verified.delete('location'); reject(error); }
      else { verified.add('location'); resolve('Allowed just now · check finished'); }
    };
    const cancel = () => finish(new Error('Location check cancelled. No location is saved.'));
    const timer = setTimeout(() => finish(new Error('Location check timed out. Check Location Services and site permissions, then retry.')), 20000);
    signal?.addEventListener('abort', cancel, { once: true });
    try {
      watchId = navigator.geolocation.watchPosition(
        () => finish(),
        error => finish(new Error(error.code === 1
          ? 'Location access was not allowed. Enable Location in site settings and device Location Services, then retry.'
          : error.code === 3 ? 'Location check timed out. Move somewhere with a clearer signal and retry.'
          : 'Your location is unavailable. Check device Location Services and retry.')),
        { enableHighAccuracy: false, maximumAge: 0, timeout: 15000 },
      );
      // Also handles implementations that invoke a callback synchronously.
      if (settled) navigator.geolocation.clearWatch(watchId);
    } catch (error) { finish(error instanceof Error ? error : new Error('Location could not start. Check site permissions and retry.')); }
  });
}
