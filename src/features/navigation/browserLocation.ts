/** One browser watch ID, used unchanged for cleanup; no permissions-query dependency. */
export function subscribeBrowserLocation(geolocation: Geolocation, onPosition: PositionCallback, onError: PositionErrorCallback) {
  let active = true;
  const id = geolocation.watchPosition(position => { if (active) onPosition(position); }, error => { if (active) onError(error); }, { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 });
  return () => { active = false; geolocation.clearWatch(id); };
}
