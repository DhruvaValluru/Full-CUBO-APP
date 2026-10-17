import { createContext, forwardRef, useContext, useEffect, useId, useImperativeHandle, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Map as LibreMap, Marker as LibreMarker, LngLatBounds, AttributionControl, type GeoJSONSource } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import { nearestBearing } from '../features/navigation/courseHeading';

type Coordinate = { latitude: number; longitude: number };
export type Region = Coordinate & { latitudeDelta: number; longitudeDelta: number };
type Camera = { center: Coordinate; heading?: number; pitch?: number; zoom?: number; altitude?: number };
export type MapView = {
  animateCamera: (camera: Camera, options?: { duration?: number }) => void;
  animateToRegion: (region: Region, duration?: number) => void;
  fitToCoordinates: (points: Coordinate[], options: { edgePadding: { top: number; right: number; bottom: number; left: number }; animated?: boolean }) => void;
};
type Props = {
  children?: ReactNode; style?: StyleProp<ViewStyle>; initialRegion: Region; userInterfaceStyle: 'light' | 'dark';
  onPress?: () => void; onPanDrag?: () => void; userLocation?: Coordinate | null; showsUserLocation?: boolean;
  showsMyLocationButton?: boolean; showsCompass?: boolean; toolbarEnabled?: boolean;
  attributionBottom?: number;
};
const MapContext = createContext<LibreMap | null>(null);
const coords = (point: Coordinate): [number, number] => [point.longitude, point.latitude];
const valid = (p: Coordinate) => Number.isFinite(p.latitude) && Number.isFinite(p.longitude) && Math.abs(p.latitude) <= 85 && Math.abs(p.longitude) <= 180;
export default forwardRef<MapView, Props>(function DrivingMap(props, ref) {
  const host = useRef<HTMLDivElement>(null);
  const instance = useRef<LibreMap | null>(null);
  const callbacks = useRef(props); callbacks.current = props;
  const [map, setMap] = useState<LibreMap | null>(null);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const pending = useRef<((map: LibreMap) => void) | null>(null);
  const run = (action: (map: LibreMap) => void) => { if (instance.current) action(instance.current); else pending.current = action; };
  useImperativeHandle(ref, () => ({
    animateCamera: (camera, options) => run(m => m.easeTo({ center: coords(camera.center), bearing: nearestBearing(m.getBearing(), camera.heading ?? 0), pitch: camera.pitch ?? 0, zoom: camera.zoom ?? 16, duration: options?.duration ?? 0 })),
    animateToRegion: (region, duration) => run(m => m.easeTo({ center: coords(region), bearing: 0, pitch: 0, zoom: 15, duration: duration ?? 0 })),
    fitToCoordinates: (points, options) => run(m => {
      const safe = points.filter(valid); if (!safe.length) return;
      const bounds = new LngLatBounds(); safe.forEach(p => bounds.extend(coords(p)));
      const height = m.getContainer().clientHeight;
      // Leave room for chrome without requesting impossible padding in small desktop previews.
      const factor = Math.min(1, Math.max(.2, (height - 100) / (options.edgePadding.top + options.edgePadding.bottom)));
      m.fitBounds(bounds, { padding: { ...options.edgePadding, top: options.edgePadding.top * factor, bottom: options.edgePadding.bottom * factor }, maxZoom: 17, duration: options.animated ? 450 : 0 });
    }),
  }), []);
  useEffect(() => {
    if (!host.current) return;
    let current: LibreMap | undefined;
    let observer: ResizeObserver | undefined;
    let live = true;
    setMap(null); setError('');
    const timer = setTimeout(() => { if (live) setError('Map is taking longer than expected. Check your connection.'); }, 20000);
    try {
      current = new LibreMap({ container: host.current, style: `https://tiles.openfreemap.org/styles/${props.userInterfaceStyle === 'dark' ? 'dark' : 'liberty'}`, center: coords(props.initialRegion), zoom: 13, attributionControl: false });
      instance.current = current;
      current.addControl(new AttributionControl({ compact: true }), 'top-left');
      current.on('load', () => { if (!live) return; clearTimeout(timer); setError(''); setMap(current!); });
      current.on('error', () => { if (live) setError('Some map tiles could not load. Check your connection.'); });
      current.on('click', () => callbacks.current.onPress?.());
      current.on('dragstart', () => callbacks.current.onPanDrag?.());
      current.on('zoomstart', event => { if (event.originalEvent) callbacks.current.onPanDrag?.(); });
      observer = new ResizeObserver(() => current?.resize()); observer.observe(host.current);
      pending.current?.(current); pending.current = null;
    } catch { setError('This browser could not start the map. Try an updated Safari or Chrome.'); }
    return () => { live = false; clearTimeout(timer); observer?.disconnect(); instance.current = null; current?.remove(); };
  }, [props.userInterfaceStyle, attempt]);
  return <View style={props.style}>
    <style>{`.cubo-driving-map .maplibregl-ctrl-top-left{top:auto;bottom:${props.attributionBottom ?? 250}px;left:4px}.cubo-driving-map .maplibregl-ctrl-attrib{font:10px/18px sans-serif;max-width:220px}.cubo-driving-map canvas{outline:none}`}</style>
    <div ref={host} className="cubo-driving-map" aria-label="Driving map" style={{ position: 'absolute', inset: 0 }} />
    <MapContext.Provider value={map}>{props.children}{props.showsUserLocation && props.userLocation && <Marker coordinate={props.userLocation}><div aria-label="Your location" style={{ width: 16, height: 16, borderRadius: 20, background: '#2985E8', border: '3px solid white', boxShadow: '0 0 0 8px #2985e826' }} /></Marker>}</MapContext.Provider>
    {error && <div role="status" style={{ position: 'absolute', top: '42%', left: 12, right: 64, padding: 12, borderRadius: 12, background: '#FFFFFF', color: '#162820', font: '12px sans-serif' }}>{error}<button style={{ minHeight: 44, marginLeft: 8 }} onClick={() => setAttempt(n => n + 1)}>Retry map</button></div>}
  </View>;
});

export function Marker({ coordinate, children, title, description, pinColor = '#167655', flat = false, rotation = 0 }: { coordinate: Coordinate; children?: ReactNode; title?: string; description?: string; pinColor?: string; anchor?: { x: number; y: number }; flat?: boolean; rotation?: number }) {
  const map = useContext(MapContext);
  const element = useRef<HTMLDivElement | null>(null);
  if (!element.current && typeof document !== 'undefined') element.current = document.createElement('div');
  const marker = useRef<LibreMarker | null>(null);
  useEffect(() => {
    if (!map || !element.current || !valid(coordinate)) return;
    marker.current = new LibreMarker({ element: element.current, anchor: 'center' }).setLngLat(coords(coordinate)).addTo(map);
    return () => { marker.current?.remove(); marker.current = null; };
  }, [map]);
  useEffect(() => { if (valid(coordinate)) marker.current?.setLngLat(coords(coordinate)); }, [coordinate.latitude, coordinate.longitude, map]);
  useEffect(() => { marker.current?.setRotationAlignment(flat ? 'map' : 'viewport').setRotation(rotation); }, [map, flat, rotation]);
  if (!element.current) return null;
  element.current.title = [title, description].filter(Boolean).join(' — ');
  return createPortal(children ?? <div aria-label={title || 'Destination'} style={{ width: 20, height: 20, borderRadius: 20, background: pinColor, border: '3px solid white' }} />, element.current);
}

export function Polyline({ coordinates, strokeColor, strokeWidth }: { coordinates: Coordinate[]; strokeColor: string; strokeWidth: number; lineCap?: string; lineJoin?: string }) {
  const map = useContext(MapContext); const id = useId();
  const data = (): GeoJSON.Feature => ({ type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: coordinates.filter(valid).map(coords) } });
  useEffect(() => {
    if (!map) return;
    map.addSource(id, { type: 'geojson', data: data() });
    map.addLayer({ id, type: 'line', source: id, paint: { 'line-color': strokeColor, 'line-width': strokeWidth }, layout: { 'line-cap': 'round', 'line-join': 'round' } });
    return () => { if (!map.getStyle()) return; if (map.getLayer(id)) map.removeLayer(id); if (map.getSource(id)) map.removeSource(id); };
  }, [map, id]);
  useEffect(() => { if (!map?.getSource(id)) return; (map.getSource(id) as GeoJSONSource).setData(data()); map.setPaintProperty(id, 'line-color', strokeColor); map.setPaintProperty(id, 'line-width', strokeWidth); }, [map, id, coordinates, strokeColor, strokeWidth]);
  return null;
}
