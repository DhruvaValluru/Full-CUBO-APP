import { useEffect, useRef, useState } from 'react';
import { Map, NavigationControl, GeolocateControl, LngLatBounds, type GeoJSONSource } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useAppearance } from '../theme/AppearanceContext';
import type { RoutePoint } from '../features/drives/types';

/** Web-only map: keep native Expo's map implementation independent. */
export function RouteMap({ points, accent, background }: { points: RoutePoint[]; accent: string; background: string }) {
  const host = useRef<HTMLDivElement>(null);
  const instance = useRef<Map | null>(null);
  const latest = useRef(points);
  latest.current = points;
  const { mode } = useAppearance();
  const [attempt, setAttempt] = useState(0);
  const [message, setMessage] = useState('Loading street map…');
  useEffect(() => {
    if (!host.current) return;
    let map: Map;
    let observer: ResizeObserver | undefined;
    let timer: ReturnType<typeof setTimeout>;
    setMessage('Loading street map…');
    try {
      map = new Map({ container: host.current, style: `https://tiles.openfreemap.org/styles/${mode === 'dark' ? 'dark' : 'liberty'}`, center: [-98, 39], zoom: 3, attributionControl: { compact: true } });
      instance.current = map;
      map.addControl(new NavigationControl({ showCompass: false }), 'top-right');
      const location = new GeolocateControl({ positionOptions: { enableHighAccuracy: true, timeout: 15000 }, trackUserLocation: true });
      map.addControl(location, 'top-right');
      location.on('error', () => setMessage('Location unavailable. Allow location in your browser settings, or explore the map manually.'));
      location.on('geolocate', () => setMessage(''));
      timer = setTimeout(() => setMessage('Map is taking longer than expected. Check your connection or retry.'), 20000);
      map.on('load', () => {
        clearTimeout(timer); setMessage('');
        map.addSource('cubo-route', { type: 'geojson', data: routeData(latest.current) });
        map.addLayer({ id: 'cubo-route-halo', type: 'line', source: 'cubo-route', paint: { 'line-color': '#FFFFFF', 'line-width': 8 }, layout: { 'line-cap': 'round', 'line-join': 'round' } });
        map.addLayer({ id: 'cubo-route-line', type: 'line', source: 'cubo-route', paint: { 'line-color': accent, 'line-width': 5 }, layout: { 'line-cap': 'round', 'line-join': 'round' } });
        fitRoute(map, latest.current);
      });
      map.on('error', () => setMessage('Some map data could not load. Check your connection or retry.'));
      observer = new ResizeObserver(() => map.resize()); observer.observe(host.current);
    } catch { setMessage('This browser could not start the map. Try an updated Safari or Chrome.'); }
    return () => { clearTimeout(timer); observer?.disconnect(); instance.current = null; map?.remove(); };
  }, [mode, attempt, accent]);
  useEffect(() => {
    const map = instance.current;
    const source = map?.getSource('cubo-route') as GeoJSONSource | undefined;
    if (map && source) { source.setData(routeData(points)); fitRoute(map, points); }
  }, [points]);
  return <div style={{ position: 'relative', height: 340, borderRadius: 16, overflow: 'hidden', background, fontFamily: 'Manrope_500Medium, sans-serif' }}>
    <style>{`.cubo-street-map .maplibregl-ctrl-group button{width:44px;height:44px}.cubo-street-map .maplibregl-ctrl-attrib{font:11px/18px sans-serif}`}</style>
    <div ref={host} className="cubo-street-map" aria-label="Interactive street map" style={{ width: '100%', height: '100%' }} />
    {message && <div role="status" style={{ position: 'absolute', left: 12, right: 64, top: 12, padding: 12, borderRadius: 12, background: mode === 'dark' ? '#1C222B' : '#FFFFFF', color: mode === 'dark' ? '#FFFFFF' : '#162820', fontSize: 12 }}>
      {message}{!message.startsWith('Loading') && <button onClick={() => setAttempt(value => value + 1)} style={{ display: 'block', minHeight: 44, color: accent, background: 'transparent', border: 0, font: 'inherit', fontWeight: 700 }}>Retry map</button>}
    </div>}
  </div>;
}

function validPoints(points: RoutePoint[]) {
  return points.filter(p => Number.isFinite(p.latitude) && Number.isFinite(p.longitude) && Math.abs(p.latitude) <= 85 && Math.abs(p.longitude) <= 180);
}
function routeData(points: RoutePoint[]): GeoJSON.FeatureCollection {
  const valid = validPoints(points);
  return { type: 'FeatureCollection', features: valid.length < 2 ? [] : [{ type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: valid.map(p => [p.longitude, p.latitude]) } }] };
}
function fitRoute(map: Map, points: RoutePoint[]) {
  const valid = validPoints(points);
  if (!valid.length) return;
  const bounds = new LngLatBounds(); valid.forEach(p => bounds.extend([p.longitude, p.latitude]));
  map.fitBounds(bounds, { padding: 52, maxZoom: 15, duration: 0 });
}
