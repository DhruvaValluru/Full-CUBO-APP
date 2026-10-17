import { useCallback, useEffect, useRef, useState } from 'react';
import { placeDistance } from '../features/places/searchPlaces';
import { subscribeBrowserLocation } from '../features/navigation/browserLocation';
import { createCourseTracker } from '../features/navigation/courseHeading';

type Point = { latitude: number; longitude: number; accuracy: number | null; heading: number | null; timestamp: number };
type Status = 'requesting' | 'active' | 'weak' | 'denied' | 'unavailable' | 'error';

/** Use the browser watcher directly: do not mix Expo listener IDs with browser watch IDs. */
export function useDriveLocation(enabled: boolean) {
  const [point, setPoint] = useState<Point | null>(null);
  const [status, setStatus] = useState<Status>('requesting');
  const [error, setError] = useState<string | null>(null);
  const [speedMph, setSpeed] = useState(0);
  const [distanceMiles, setDistance] = useState(0);
  const [attempt, setAttempt] = useState(0);
  const [now, setNow] = useState(Date.now());
  const previous = useRef<Point | null>(null);
  const retry = useCallback(() => setAttempt(value => value + 1), []);
  useEffect(() => {
    if (!enabled) return;
    if (!window.isSecureContext || !navigator.geolocation) {
      setStatus('unavailable'); setError('Location requires HTTPS and a browser with location support.'); return;
    }
    let active = true;
    const trackCourse = createCourseTracker();
    previous.current = null;
    setStatus('requesting'); setError(null);
    const unsubscribe = subscribeBrowserLocation(navigator.geolocation, location => {
      if (!active) return;
      const { latitude, longitude, accuracy, heading, speed } = location.coords;
      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return;
      const fix = { latitude, longitude, accuracy, timestamp: location.timestamp };
      const next: Point = { ...fix, heading: trackCourse(fix, heading, speed) };
      const last = previous.current;
      const weak = accuracy > 40;
      const elapsed = last ? (next.timestamp - last.timestamp) / 1000 : 0;
      const distance = last ? placeDistance(last, next) : 0;
      const reliableDelta = !!last && elapsed > 0 && elapsed < 20 && !weak && (last.accuracy ?? 100) <= 40 && distance >= Math.max(5, accuracy, last.accuracy ?? 5) && distance / elapsed < 75;
      if (reliableDelta) setDistance(value => value + distance / 1609.344);
      const mps = speed != null && Number.isFinite(speed) && speed >= 0 ? speed : reliableDelta ? distance / elapsed : 0;
      setSpeed(Math.round(Math.min(160, mps < .7 ? 0 : mps * 2.236936)));
      previous.current = next; setPoint(next); setNow(Date.now()); setStatus(weak ? 'weak' : 'active'); setError(null);
    }, failure => {
      if (!active) return;
      setStatus(failure.code === 1 ? 'denied' : 'error'); setSpeed(0);
      setError(failure.code === 1 ? 'Location is blocked. Allow Location in this website’s Safari settings, then tap Enable location.' : 'GPS is unavailable. Move somewhere with a clear signal and retry.');
    });
    const timer = setInterval(() => setNow(Date.now()), 5000);
    return () => { active = false; unsubscribe(); clearInterval(timer); previous.current = null; };
  }, [enabled, attempt]);
  const hasFix = enabled && !!point && now - point.timestamp < 30000 && (status === 'active' || status === 'weak');
  return { point, status, error, speedMph: hasFix ? speedMph : 0, distanceMiles, hasFix, retry };
}
