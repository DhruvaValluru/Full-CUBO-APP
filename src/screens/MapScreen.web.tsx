import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, usePreventRemove, type NavigationProp } from '@react-navigation/native';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { MotionPressable } from '../components/MotionPressable';
import { usePlaceSuggestions } from '../features/places/usePlaceSuggestions';
import { searchPlaces, type PlaceResult } from '../features/places/searchPlaces';
import { RecentDestinations } from '../components/RecentDestinations';
import { usePlaces } from '../features/places/PlacesContext';
import { useIsFocused } from '@react-navigation/native';
import { RouteMap } from '../components/RouteMap';
import { ScreenShell } from '../components/ScreenShell';
import { useDrives } from '../features/drives/DriveContext';
import { useDriveLocation } from '../hooks/useDriveLocation';
import { elapsedSeconds, formatDuration } from '../features/drives/formatDuration';
import type { RootStackParamList } from '../navigation/types';
import type { RoutePoint } from '../features/drives/types';
import { useAppearance } from '../theme/AppearanceContext';
import type { AppColors } from '../theme/colors';

export function MapScreen() {
  const { colors: c } = useAppearance();
  const s = makeThemeStyles(c);

  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const { activeSession, startDrive, endDrive, updateDrive, addRoutePoint, cameraConfirmation } = useDrives();
  const focused = useIsFocused(); const gps = useDriveLocation(focused);
  const screenRoute = useRoute();
  const incoming = (screenRoute.params as { destination?: PlaceResult } | undefined)?.destination;
  const { remember, recent } = usePlaces();
  const awaiting = useRef<number | null>(null);
  const loaded = useRef<string | null>(null);
  const [query, setQuery] = useState('');
  const [showRecent, setShowRecent] = useState(false);
  const [route, setRoute] = useState<RoutePoint[]>([]);
  const [busy, setBusy] = useState(false);
  const { results: suggestions, setResults: setSuggestions, error: suggestionError } = usePlaceSuggestions(query, gps.point, focused && !route.length && !busy);
  const [message, setMessage] = useState('Choose a destination to preview your route.');
  const [finished, setFinished] = useState<string | null>(null);
  const baseline = useRef(0);
  useEffect(() => { if (awaiting.current == null || !focused || cameraConfirmation <= awaiting.current) return; awaiting.current = null; baseline.current = gps.distanceMiles; startDrive(); }, [cameraConfirmation, focused]);
  useEffect(() => { if (suggestionError) setMessage(suggestionError); }, [suggestionError]);
  usePreventRemove(!!activeSession, () => {});
  useEffect(() => {
    if (!activeSession) return;
    const timer = setInterval(() => updateDrive({ durationSeconds: elapsedSeconds(activeSession.startedAt), focusScore: activeSession.focusScore, distanceMiles: Math.max(0, gps.distanceMiles - baseline.current) }), 1000);
    return () => clearInterval(timer);
  }, [activeSession?.id, gps.distanceMiles, updateDrive]);
  useEffect(() => { if (activeSession && gps.point) addRoutePoint(gps.point.latitude, gps.point.longitude, gps.speedMph); }, [activeSession?.id, gps.point?.timestamp, addRoutePoint]);
  useEffect(() => { if (finished && !activeSession) navigation.reset({ index: 1, routes: [{ name: 'MainTabs', params: { screen: 'Home' } }, { name: 'TripSummary', params: { sessionId: finished } }] }); }, [finished, activeSession, navigation]);

  const search = async (chosen?: PlaceResult) => {
    if ((!chosen && !query.trim()) || busy) return;
    if (!gps.point) { setMessage('Allow location access so CUBO can route from your position.'); return; }
    setShowRecent(false); setBusy(true); setRoute([]);
    try {
      const place = chosen ?? (await searchPlaces(query.trim(), gps.point))[0];
      if (!place) { setMessage('No matching destination found.'); return; }
      remember(place); setQuery(place.title); setSuggestions([]);
      const destination = [place.longitude, place.latitude];
      const routing = await fetch(`https://router.project-osrm.org/route/v1/driving/${gps.point.longitude},${gps.point.latitude};${destination[0]},${destination[1]}?overview=full&geometries=geojson`);
      if (!routing.ok) throw Error();
      const result = (await routing.json()).routes?.[0];
      if (!result) throw Error();
      setRoute(result.geometry.coordinates.map(([longitude, latitude]: [number, number]) => ({ latitude, longitude, recordedAt: '', speedMph: 0 })));
      setMessage(`${(result.distance / 1609.344).toFixed(1)} mi · ${formatDuration(Math.round(result.duration))}`);
    } catch { setMessage('Route unavailable. Please try again.'); }
    finally { setBusy(false); }
  };
  useEffect(() => { if (incoming && gps.point && loaded.current !== incoming.id) { loaded.current = incoming.id; void search(incoming); } }, [incoming?.id, gps.point?.timestamp]);
  return <ScreenShell><Text style={s.title}>{activeSession ? 'Live drive' : 'Choose your route'}</Text>{!activeSession ? <View style={s.search}><TextInput accessibilityLabel="Destination" onFocus={() => setShowRecent(!query.trim() || !!route.length)} placeholder="Where do you want to go?" placeholderTextColor={c.textTertiary} value={query} onChangeText={(text) => { setShowRecent(!text.trim()); setQuery(text); setRoute([]); }} onSubmitEditing={() => void search()} style={s.input} /><MotionPressable accessibilityLabel="Search destination" style={s.searchButton} onPress={() => void search()}><Ionicons name={busy ? 'hourglass-outline' : 'search'} size={19} color={c.onAccent} /></MotionPressable></View> : <Text style={s.message}>{formatDuration(activeSession.durationSeconds)} · {gps.speedMph} mph</Text>}{!activeSession && showRecent && <RecentDestinations places={recent} onSelect={place => void search(place)} />}{!activeSession && !showRecent ? suggestions.map(place => <MotionPressable key={place.id} style={{ backgroundColor: c.card, borderRadius: 16, padding: 14 }} onPress={() => void search(place)}><Text style={{ color: c.text, fontFamily: 'Manrope_700Bold', fontSize: 13 }}>{place.title}</Text><Text style={s.message}>{place.subtitle}</Text></MotionPressable>) : null}<View style={s.map}><RouteMap points={activeSession?.route ?? route} accent={c.accent} background={c.mapSurface} /></View><Text style={s.message}>{message}</Text>{activeSession ? <MotionPressable style={[s.primary, { backgroundColor: c.danger }]} onPress={() => { const trip = endDrive(); if (trip) setFinished(trip.id); }}><Ionicons name="stop-circle" size={18} color="#FFFFFF" /><Text style={[s.primaryText, { color: '#FFFFFF' }]}>End drive</Text></MotionPressable> : <><MotionPressable disabled={route.length < 2 || !gps.hasFix} style={[s.primary, { opacity: route.length < 2 ? .4 : 1 }]} onPress={() => { awaiting.current = cameraConfirmation; navigation.navigate('LiveDrive'); }}><Text style={s.primaryText}>Start drive</Text><Ionicons name="navigate" size={18} color={c.onAccent} /></MotionPressable><MotionPressable style={s.back} onPress={() => navigation.navigate('ReturningHome')}><Ionicons name="home-outline" size={18} color={c.accent} /><Text style={{ color: c.text, fontFamily: 'Manrope_700Bold', fontSize: 12 }}>Back to home</Text></MotionPressable></>}<Text style={s.note}>Street maps and the floating camera are available in the phone app.</Text></ScreenShell>;
}
const makeThemeStyles = (c: AppColors) => StyleSheet.create({ title: { color: c.text, fontFamily: 'Manrope_800ExtraBold', fontSize: 24, marginVertical: 12 }, search: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: c.card, borderRadius: 18, padding: 10 }, input: { flex: 1, padding: 8, color: c.text, fontSize: 12 }, searchButton: { width: 44, height: 44, borderRadius: 14, backgroundColor: c.accent, alignItems: 'center', justifyContent: 'center' }, map: { padding: 8, borderRadius: 22, backgroundColor: c.card }, message: { color: c.textSecondary, fontSize: 11, lineHeight: 17 }, primary: { backgroundColor: c.accent, borderRadius: 18, minHeight: 54, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 9 }, primaryText: { color: c.onAccent, fontFamily: 'Manrope_800ExtraBold', fontSize: 14 }, back: { minHeight: 46, borderRadius: 16, backgroundColor: c.surfaceMuted, flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center' }, note: { color: c.textTertiary, fontSize: 10, lineHeight: 16 } });
