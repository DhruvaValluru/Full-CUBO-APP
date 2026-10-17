export function accessError(error: unknown): string {
  const name = error && typeof error === 'object' && 'name' in error ? error.name : '';
  if (name === 'NotAllowedError' || name === 'SecurityError') return 'Access was not allowed. If no prompt appears, allow access in this website’s browser settings (or app permissions), then retry. CUBO cannot override a blocked permission.';
  if (name === 'NotFoundError') return 'No matching camera or microphone was found on this device.';
  if (name === 'NotReadableError' || name === 'AbortError') return 'The device could not start. Close other camera/microphone apps, then retry.';
  return error instanceof Error ? error.message : 'Access could not be checked. Review your browser or device permissions and retry.';
}
