import * as Location from 'expo-location';
import { useEffect, useRef, useState } from 'react';
import { estimateSpeedMph, freshFix, GPS_FRESH_MS } from './gpsSpeed';

export type DriveGpsStatus = 'requesting' | 'active' | 'weak' | 'denied' | 'unavailable' | 'error';
type GpsPoint = { latitude: number; longitude: number; accuracy: number | null; heading: number | null; timestamp: number };

const METERS_TO_MILES = 0.000621371;

function distanceMeters(a: GpsPoint, b: GpsPoint) {
  const radius = 6371000;
  const lat1 = a.latitude * Math.PI / 180;
  const lat2 = b.latitude * Math.PI / 180;
  const dLat = lat2 - lat1;
  const dLon = (b.longitude - a.longitude) * Math.PI / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return radius * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

export function useDriveLocation(enabled: boolean) {
  const [status, setStatus] = useState<DriveGpsStatus>('requesting');
  const [point, setPoint] = useState<GpsPoint | null>(null);
  const [speedMph, setSpeedMph] = useState(0);
  const [speedAvailable, setSpeedAvailable] = useState(false);
  const [distanceMiles, setDistanceMiles] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const previous = useRef<GpsPoint | null>(null);
  const speeds = useRef<number[]>([]);

  useEffect(() => {
    if (!enabled) return;
    let mounted = true;
    previous.current = null; speeds.current = [];
    setPoint(null); setSpeedMph(0); setSpeedAvailable(false); setError(null);
    const freshnessTimer = setInterval(() => {
      if (previous.current && Date.now() - previous.current.timestamp > GPS_FRESH_MS) {
        setStatus(current => current === 'active' ? 'weak' : current);
        setSpeedAvailable(false); setSpeedMph(0); speeds.current = [];
      }
    }, 1000);
    let subscription: Location.LocationSubscription | null = null;

    const start = async () => {
      try {
        setStatus('requesting');
        const servicesEnabled = await Location.hasServicesEnabledAsync();
        if (!servicesEnabled) { if (mounted) setStatus('unavailable'); return; }
        const permission = await Location.requestForegroundPermissionsAsync();
        if (permission.status !== 'granted') { if (mounted) setStatus('denied'); return; }

        subscription = await Location.watchPositionAsync({
          accuracy: Location.Accuracy.BestForNavigation,
          timeInterval: 1000,
          distanceInterval: 0,
          mayShowUserSettingsDialog: true,
        }, (location) => {
          if (!mounted) return;
          const next: GpsPoint = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            accuracy: location.coords.accuracy,
            heading: location.coords.heading != null && location.coords.heading >= 0 ? location.coords.heading : null,
            timestamp: location.timestamp,
          };
          if (!Number.isFinite(next.latitude) || !Number.isFinite(next.longitude) || !Number.isFinite(next.timestamp) || (previous.current && next.timestamp <= previous.current.timestamp)) return;
          const weak = !freshFix(next, Date.now());
          setStatus(weak ? 'weak' : 'active');
          setPoint(next);

          const last = previous.current;
          const mph = estimateSpeedMph(location.coords.speed, next, last, last ? distanceMeters(last, next) : 0, Date.now());
          setSpeedAvailable(mph != null);
          if (mph != null) {
            speeds.current = mph === 0 ? [0] : [...speeds.current.slice(-2), mph];
            setSpeedMph(speeds.current.reduce((sum, value) => sum + value, 0) / speeds.current.length);
          } else {
            speeds.current = []; setSpeedMph(0);
          }
          if (last && !weak) {
            const delta = distanceMeters(last, next);
            if (delta >= Math.max(5, next.accuracy ?? 5, last.accuracy ?? 5) && delta < 250) setDistanceMiles((total) => total + delta * METERS_TO_MILES);
          }
          previous.current = next;
        }, (message) => { if (mounted) { setError(message); setStatus('error'); setSpeedAvailable(false); setSpeedMph(0); } });
        if (!mounted) subscription.remove();
      } catch (cause) {
        if (mounted) { setError(cause instanceof Error ? cause.message : 'GPS could not start.'); setStatus('error'); }
      }
    };

    start();
    return () => { mounted = false; clearInterval(freshnessTimer); subscription?.remove(); };
  }, [enabled]);

  return { status, point, speedMph: Math.round(speedMph), speedAvailable: enabled && status === 'active' && speedAvailable, distanceMiles, error, hasFix: point != null };
}
