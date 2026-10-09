import * as Location from 'expo-location';
import { useEffect, useRef, useState } from 'react';

export type DriveGpsStatus = 'requesting' | 'active' | 'weak' | 'denied' | 'unavailable' | 'error';
type GpsPoint = { latitude: number; longitude: number; accuracy: number | null; heading: number | null; timestamp: number };

const METERS_TO_MILES = 0.000621371;
const MPS_TO_MPH = 2.236936;

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
  const [distanceMiles, setDistanceMiles] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const previous = useRef<GpsPoint | null>(null);
  const speeds = useRef<number[]>([]);

  useEffect(() => {
    if (!enabled) return;
    let mounted = true;
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
          distanceInterval: 2,
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
          const weak = next.accuracy != null && next.accuracy > 40;
          setStatus(weak ? 'weak' : 'active');
          setPoint(next);

          const last = previous.current;
          let measuredMps = location.coords.speed != null && location.coords.speed >= 0 ? location.coords.speed : null;
          if (measuredMps == null && last) {
            const seconds = Math.max(0.1, (next.timestamp - last.timestamp) / 1000);
            measuredMps = distanceMeters(last, next) / seconds;
          }
          if (measuredMps != null) {
            const mph = measuredMps < 0.7 ? 0 : Math.min(160, measuredMps * MPS_TO_MPH);
            speeds.current = [...speeds.current.slice(-4), mph];
            setSpeedMph(speeds.current.reduce((sum, value) => sum + value, 0) / speeds.current.length);
          }
          if (last && !weak) {
            const delta = distanceMeters(last, next);
            if (delta >= 1 && delta < 250) setDistanceMiles((total) => total + delta * METERS_TO_MILES);
          }
          previous.current = next;
        }, (message) => { if (mounted) { setError(message); setStatus('error'); } });
      } catch (cause) {
        if (mounted) { setError(cause instanceof Error ? cause.message : 'GPS could not start.'); setStatus('error'); }
      }
    };

    start();
    return () => { mounted = false; subscription?.remove(); };
  }, [enabled]);

  return { status, point, speedMph: Math.round(speedMph), distanceMiles, error, hasFix: point != null };
}
