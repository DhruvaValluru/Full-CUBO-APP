import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useIsFocused } from '@react-navigation/native';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Keyboard, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import MapView, { Marker, Polyline, type Region } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useDrives } from '../features/drives/DriveContext';
import type { RoadHazardKind } from '../features/drives/types';
import { useDriveLocation } from '../hooks/useDriveLocation';
import { useAppearance } from '../theme/AppearanceContext';
import type { AppColors } from '../theme/colors';
import { spacing } from '../theme/theme';

const fallbackRegion: Region = { latitude: 35.7796, longitude: -78.6382, latitudeDelta: .035, longitudeDelta: .035 };
const hazardMeta: Record<RoadHazardKind, { icon: keyof typeof Ionicons.glyphMap; color: string }> = {
  object: { icon: 'cube-outline', color: '#FFB020' }, police: { icon: 'shield-outline', color: '#3D8DFF' }, crash: { icon: 'warning-outline', color: '#FF453A' },
};
type PlaceSuggestion = { id: string; title: string; subtitle: string; latitude: number; longitude: number };
type Coordinate = { latitude: number; longitude: number };
type NavigationStep = { location: Coordinate; distanceMeters: number; name: string; type: string; modifier?: string };
type NavigationRoute = { coordinates: Coordinate[]; distanceMeters: number; durationSeconds: number; steps: NavigationStep[] };

function distanceMeters(a: Coordinate, b: Coordinate) {
  const radius = 6371000;
  const lat1 = a.latitude * Math.PI / 180;
  const lat2 = b.latitude * Math.PI / 180;
  const dLat = lat2 - lat1;
  const dLon = (b.longitude - a.longitude) * Math.PI / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return radius * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

function stepInstruction(step?: NavigationStep) {
  if (!step) return 'Continue toward your destination';
  if (step.type === 'arrive') return 'You have arrived';
  const direction = step.modifier ? `${step.modifier.replace('-', ' ')} ` : '';
  const action = step.type === 'depart' ? 'Head' : step.type === 'turn' ? 'Turn' : step.type === 'merge' ? 'Merge' : 'Continue';
  return `${action} ${direction}${step.name ? `onto ${step.name}` : ''}`.replace(/\s+/g, ' ').trim();
}

function formatStepDistance(meters?: number) {
  if (meters == null) return '';
  if (meters < 160) return `${Math.max(20, Math.round(meters / 10) * 10)} ft`;
  return `${(meters * .000621371).toFixed(meters < 1609 ? 1 : 0)} mi`;
}

export function MapScreen() {
  const focused = useIsFocused();
  const gps = useDriveLocation(focused);
  const { activeSession, sessions } = useDrives();
  const { colors, mode } = useAppearance();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const mapRef = useRef<MapView>(null);
  const searchInputRef = useRef<TextInput>(null);
  const [query, setQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [searching, setSearching] = useState(false);
  const [searchResult, setSearchResult] = useState<{ latitude: number; longitude: number } | null>(null);
  const [searchMessage, setSearchMessage] = useState('');
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [suggesting, setSuggesting] = useState(false);
  const [routing, setRouting] = useState(false);
  const [navigationRoute, setNavigationRoute] = useState<NavigationRoute | null>(null);
  const [navigating, setNavigating] = useState(false);
  const [following, setFollowing] = useState(true);
  const [stepIndex, setStepIndex] = useState(0);
  const trip = activeSession ?? sessions[0];
  const hazards = trip?.events.filter((event) => event.type === 'road_hazard' && event.latitude != null && event.longitude != null) ?? [];
  const recordedRoute = trip?.route ?? [];
  const center = gps.point ?? recordedRoute[recordedRoute.length - 1] ?? fallbackRegion;
  const dismissSearchKeyboard = () => { searchInputRef.current?.blur(); Keyboard.dismiss(); };
  const focusDriver = () => {
    if (!gps.point) return;
    mapRef.current?.animateCamera({ center: gps.point, heading: gps.point.heading ?? 0, pitch: navigating ? 55 : 0, zoom: navigating ? 17.5 : 15 }, { duration: 550 });
  };
  const recenter = () => { if (navigating) { setFollowing(true); focusDriver(); } else mapRef.current?.animateToRegion({ latitude: center.latitude, longitude: center.longitude, latitudeDelta: .015, longitudeDelta: .015 }, 450); };

  const buildRoute = async (destination: Coordinate) => {
    const origin = gps.point ?? recordedRoute[recordedRoute.length - 1];
    if (!origin) { setSearchMessage('Waiting for your GPS location'); return; }
    setRouting(true);
    try {
      const coordinates = `${origin.longitude},${origin.latitude};${destination.longitude},${destination.latitude}`;
      const response = await fetch(`https://router.project-osrm.org/route/v1/driving/${coordinates}?overview=full&geometries=geojson&steps=true`);
      if (!response.ok) throw new Error('Routing service unavailable');
      const payload = await response.json() as { routes?: Array<{ distance: number; duration: number; geometry?: { coordinates?: [number, number][] }; legs?: Array<{ steps?: Array<{ distance: number; name: string; maneuver: { location: [number, number]; type: string; modifier?: string } }> }> }> };
      const firstRoute = payload.routes?.[0];
      const line = firstRoute?.geometry?.coordinates?.map(([longitude, latitude]) => ({ latitude, longitude })) ?? [];
      if (!firstRoute || line.length < 2) { setNavigationRoute(null); setSearchMessage('No driving route found'); return; }
      const steps = (firstRoute.legs?.[0]?.steps ?? []).map((step) => ({ location: { longitude: step.maneuver.location[0], latitude: step.maneuver.location[1] }, distanceMeters: step.distance, name: step.name, type: step.maneuver.type, modifier: step.maneuver.modifier }));
      setNavigationRoute({ coordinates: line, distanceMeters: firstRoute.distance, durationSeconds: firstRoute.duration, steps });
      setNavigating(false); setFollowing(true); setStepIndex(0);
      setSearchMessage(`${(firstRoute.distance * .000621371).toFixed(1)} mi · ${Math.max(1, Math.round(firstRoute.duration / 60))} min`);
      mapRef.current?.fitToCoordinates(line, { edgePadding: { top: 150, right: 45, bottom: 260, left: 45 }, animated: true });
    } catch { setNavigationRoute(null); setSearchMessage('Route unavailable — try again'); }
    finally { setRouting(false); }
  };

  const search = async () => {
    const clean = query.trim(); if (!clean || searching || routing) return;
    dismissSearchKeyboard();
    setSearching(true); setSearchMessage('');
    try {
      const [result] = await Location.geocodeAsync(clean);
      if (!result) { setSearchMessage('No place found'); return; }
      const destination = { latitude: result.latitude, longitude: result.longitude };
      setSearchResult(destination); setSuggestions([]);
      await buildRoute(destination);
    } catch { setSearchMessage('Search unavailable'); } finally { setSearching(false); }
  };
  useEffect(() => {
    const clean = query.trim();
    if (clean.length < 3 || searchResult) { setSuggestions([]); setSuggesting(false); return; }
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setSuggesting(true);
      try {
        const response = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(clean)}&limit=5&lang=en`, { signal: controller.signal });
        if (!response.ok) throw new Error('Suggestion service unavailable');
        const payload = await response.json() as { features?: Array<{ geometry?: { coordinates?: [number, number] }; properties?: Record<string, string> }> };
        const next = (payload.features ?? []).flatMap((feature, index) => {
          const coordinates = feature.geometry?.coordinates; if (!coordinates) return [];
          const properties = feature.properties ?? {};
          const streetAddress = [properties.housenumber, properties.street].filter(Boolean).join(' ');
          const locality = [properties.city || properties.district || properties.county, properties.state, properties.postcode, properties.country].filter(Boolean).join(', ');
          const title = properties.name || streetAddress || properties.city || clean;
          const subtitle = (properties.name ? [streetAddress, locality] : [locality]).filter((part) => part && part !== title).join(' · ');
          return [{ id: `${coordinates[0]}-${coordinates[1]}-${index}`, title, subtitle, longitude: coordinates[0], latitude: coordinates[1] }];
        });
        setSuggestions(next);
      } catch (cause) { if (!(cause instanceof Error && cause.name === 'AbortError')) setSuggestions([]); }
      finally { if (!controller.signal.aborted) setSuggesting(false); }
    }, 350);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [query, searchResult]);

  const chooseSuggestion = async (suggestion: PlaceSuggestion) => {
    dismissSearchKeyboard();
    const destination = { latitude: suggestion.latitude, longitude: suggestion.longitude };
    setQuery(suggestion.title); setSearchResult(destination); setSuggestions([]); setSearchMessage(suggestion.subtitle || suggestion.title);
    await buildRoute(destination);
  };

  const startNavigation = () => {
    if (!gps.point) { setSearchMessage('Waiting for your GPS location'); return; }
    setNavigating(true); setFollowing(true); setStepIndex(0);
    mapRef.current?.animateCamera({ center: gps.point, heading: gps.point.heading ?? 0, pitch: 55, zoom: 17.5 }, { duration: 700 });
  };

  useEffect(() => {
    if (!navigating || !gps.point || !navigationRoute) return;
    if (following) mapRef.current?.animateCamera({ center: gps.point, heading: gps.point.heading ?? 0, pitch: 55, zoom: 17.5 }, { duration: 650 });
    const nextStep = navigationRoute.steps[stepIndex];
    if (nextStep && distanceMeters(gps.point, nextStep.location) < 45 && stepIndex < navigationRoute.steps.length - 1) setStepIndex((current) => current + 1);
  }, [following, gps.point, navigating, navigationRoute, stepIndex]);

  const currentStep = navigationRoute?.steps[stepIndex];

  return <View style={styles.root}>
    <MapView ref={mapRef} style={StyleSheet.absoluteFill} initialRegion={fallbackRegion} showsUserLocation={gps.hasFix && !navigating} showsMyLocationButton={false} showsCompass={false} toolbarEnabled={false} userInterfaceStyle={mode} onPress={dismissSearchKeyboard} onPanDrag={() => { dismissSearchKeyboard(); if (navigating) setFollowing(false); }}>
      {navigationRoute ? <Polyline coordinates={navigationRoute.coordinates} strokeColor="#3D8DFF" strokeWidth={7} lineCap="round" lineJoin="round" /> : null}
      {navigating && gps.point ? <Marker coordinate={gps.point} anchor={{ x: .5, y: .5 }} flat rotation={gps.point.heading ?? 0}><View style={styles.driverMarker}><Ionicons name="navigate" size={20} color="#FFFFFF" /></View></Marker> : null}
      {searchResult ? <Marker coordinate={searchResult} title={query.trim() || 'Search result'} pinColor={colors.accent} /> : null}
      {hazards.map((hazard) => { const meta = hazardMeta[hazard.hazardKind ?? 'object']; return <Marker key={hazard.id} coordinate={{ latitude: hazard.latitude!, longitude: hazard.longitude! }} title={hazard.title} description={hazard.detail}><View style={[styles.hazardPin, { backgroundColor: meta.color }]}><Ionicons name={meta.icon} size={16} color="#fff" /></View></Marker>; })}
    </MapView>
    <SafeAreaView edges={['top']} style={styles.overlay} pointerEvents="box-none">
      {navigating ? <View style={styles.guidanceCard}><View style={styles.maneuverIcon}><Ionicons name={currentStep?.type === 'arrive' ? 'flag' : 'arrow-up'} size={25} color={colors.onAccent} /></View><View style={styles.fill}><Text style={styles.stepDistance}>{formatStepDistance(gps.point && currentStep ? distanceMeters(gps.point, currentStep.location) : currentStep?.distanceMeters)}</Text><Text numberOfLines={2} style={styles.instruction}>{stepInstruction(currentStep)}</Text></View><Pressable accessibilityLabel="End route" onPress={() => { setNavigating(false); setFollowing(true); }} style={styles.closeNavigation}><Ionicons name="close" size={19} color={colors.textSecondary} /></Pressable></View> : <View style={styles.topCard}><View style={styles.searchRow}><Ionicons name="search" size={19} color={colors.textSecondary} /><TextInput ref={searchInputRef} value={query} onFocus={() => setSearchFocused(true)} onBlur={() => setSearchFocused(false)} onChangeText={(value) => { setQuery(value); setSearchResult(null); setNavigationRoute(null); setSearchMessage(''); }} onSubmitEditing={() => void search()} returnKeyType="search" placeholder="Where do you want to go?" placeholderTextColor={colors.textTertiary} style={styles.searchInput} />{query ? <Pressable accessibilityLabel="Clear search" onPress={() => { setQuery(''); setSearchResult(null); setNavigationRoute(null); setSearchMessage(''); setSuggestions([]); }} style={styles.inputAction}><Ionicons name="close-circle" size={19} color={colors.textTertiary} /></Pressable> : null}{searchFocused ? <Pressable accessibilityLabel="Hide keyboard" onPress={dismissSearchKeyboard} style={styles.inputAction}><Ionicons name="chevron-down" size={18} color={colors.textSecondary} /></Pressable> : null}<Pressable disabled={!query.trim() || searching || routing} onPress={() => void search()} style={[styles.searchButton, (!query.trim() || searching || routing) && styles.searchDisabled]}><Ionicons name={searching || suggesting || routing ? 'hourglass-outline' : 'arrow-forward'} size={15} color={colors.onAccent} /></Pressable></View>{searching || routing ? <View style={styles.searchStatus}><View style={styles.statusDot} /><Text style={styles.statusText}>{routing ? 'Building your route…' : 'Finding that place…'}</Text></View> : null}{suggestions.length ? <View style={styles.suggestions}>{suggestions.map((suggestion, index) => <Pressable key={suggestion.id} onPress={() => void chooseSuggestion(suggestion)} style={[styles.suggestion, index === suggestions.length - 1 && styles.suggestionLast]}><View style={styles.suggestionIcon}><Ionicons name="location" size={17} color={colors.accent} /></View><View style={styles.fill}><Text numberOfLines={1} style={styles.suggestionTitle}>{suggestion.title}</Text><Text numberOfLines={2} style={styles.suggestionSubtitle}>{suggestion.subtitle || 'Tap to view this location'}</Text></View><Ionicons name="chevron-forward" size={16} color={colors.textTertiary} /></Pressable>)}</View> : null}</View>}
      <Pressable style={styles.recenter} onPress={() => { dismissSearchKeyboard(); recenter(); }}><Ionicons name="locate" size={21} color={colors.text} /></Pressable>
      <View style={styles.bottomCard} onTouchStart={dismissSearchKeyboard}>
        <View style={styles.grabber} /><View style={styles.tripRow}><View><Text style={styles.eyebrow}>{navigationRoute ? 'ROUTE READY' : activeSession ? 'LIVE DRIVE' : 'ROAD OVERVIEW'}</Text><Text style={styles.cardTitle}>{navigationRoute ? `${(navigationRoute.distanceMeters * .000621371).toFixed(1)} mi` : gps.hasFix ? `${gps.speedMph} mph` : `${hazards.length} nearby report${hazards.length === 1 ? '' : 's'}`}</Text></View><View style={styles.stats}><View><Text style={styles.statValue}>{navigationRoute ? Math.max(1, Math.round(navigationRoute.durationSeconds / 60)) : recordedRoute.length}</Text><Text style={styles.statLabel}>{navigationRoute ? 'min ETA' : 'GPS points'}</Text></View><View><Text style={styles.statValue}>{hazards.length}</Text><Text style={styles.statLabel}>Hazards</Text></View></View></View>
        {navigationRoute && !navigating ? <Pressable onPress={startNavigation} style={styles.startRoute}><Ionicons name="navigate" size={17} color={colors.onAccent} /><Text style={styles.startRouteText}>Start Route</Text></Pressable> : null}
        <Text style={styles.privacy}>{navigationRoute ? navigating ? `${following ? 'Following your location' : 'Map unlocked'} · Tap locate to recenter` : 'Preview the route, then start when you are ready.' : 'Location is used only while CUBO is open. Camera frames are never added to the map.'}</Text>
      </View>
    </SafeAreaView>
  </View>;
}

const makeStyles = (c: AppColors) => StyleSheet.create({
  root: { flex: 1, backgroundColor: c.background }, overlay: { flex: 1, paddingHorizontal: spacing.md, paddingBottom: 116 }, fill: { flex: 1 },
  topCard: { minHeight: 56, borderRadius: 20, backgroundColor: c.card, borderWidth: StyleSheet.hairlineWidth, borderColor: c.border, padding: 10, gap: 8, shadowColor: c.shadow, shadowOpacity: .18, shadowRadius: 16, shadowOffset: { width: 0, height: 8 } }, searchRow: { flexDirection: 'row', alignItems: 'center', gap: 7 }, searchInput: { flex: 1, color: c.text, fontFamily: 'Manrope_600SemiBold', fontSize: 13, paddingVertical: 8 }, inputAction: { width: 28, height: 32, alignItems: 'center', justifyContent: 'center' }, searchButton: { width: 36, height: 36, borderRadius: 12, backgroundColor: c.accent, alignItems: 'center', justifyContent: 'center' }, searchDisabled: { opacity: .35 }, searchStatus: { flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 4, paddingBottom: 2 }, statusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: c.accent }, statusText: { color: c.textSecondary, fontFamily: 'Manrope_600SemiBold', fontSize: 9 },
  guidanceCard: { minHeight: 82, borderRadius: 20, backgroundColor: c.card, borderWidth: StyleSheet.hairlineWidth, borderColor: c.border, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 12, shadowColor: c.shadow, shadowOpacity: .2, shadowRadius: 18, shadowOffset: { width: 0, height: 8 } }, maneuverIcon: { width: 46, height: 46, borderRadius: 15, backgroundColor: c.accent, alignItems: 'center', justifyContent: 'center' }, stepDistance: { color: c.accent, fontFamily: 'Manrope_800ExtraBold', fontSize: 11 }, instruction: { color: c.text, fontFamily: 'Manrope_700Bold', fontSize: 14, lineHeight: 18, marginTop: 2 }, closeNavigation: { width: 32, height: 32, borderRadius: 11, backgroundColor: c.surfaceMuted, alignItems: 'center', justifyContent: 'center' },
  suggestions: { borderRadius: 15, backgroundColor: c.surfaceMuted, overflow: 'hidden', borderWidth: StyleSheet.hairlineWidth, borderColor: c.border }, suggestion: { minHeight: 62, flexDirection: 'row', alignItems: 'center', gap: 11, paddingHorizontal: 10, paddingVertical: 9, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: c.border }, suggestionLast: { borderBottomWidth: 0 }, suggestionIcon: { width: 36, height: 36, borderRadius: 12, backgroundColor: c.accentSoft, alignItems: 'center', justifyContent: 'center' }, suggestionTitle: { color: c.text, fontFamily: 'Manrope_700Bold', fontSize: 12 }, suggestionSubtitle: { color: c.textSecondary, fontSize: 9, lineHeight: 13, marginTop: 3 },
  recenter: { position: 'absolute', right: spacing.md, bottom: 300, width: 44, height: 44, borderRadius: 15, backgroundColor: c.card, borderWidth: StyleSheet.hairlineWidth, borderColor: c.border, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: .15, shadowRadius: 10 },
  bottomCard: { marginTop: 'auto', borderRadius: 24, backgroundColor: c.card, borderWidth: StyleSheet.hairlineWidth, borderColor: c.border, padding: 15, shadowColor: '#000', shadowOpacity: .22, shadowRadius: 24, shadowOffset: { width: 0, height: 10 } }, grabber: { width: 34, height: 4, borderRadius: 2, backgroundColor: c.surfaceMuted, alignSelf: 'center', marginBottom: 12 }, tripRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, eyebrow: { color: c.accent, fontFamily: 'Manrope_700Bold', fontSize: 8, letterSpacing: 1 }, cardTitle: { color: c.text, fontFamily: 'Manrope_800ExtraBold', fontSize: 22, marginTop: 2 }, stats: { flexDirection: 'row', gap: 20 }, statValue: { color: c.text, fontFamily: 'Manrope_800ExtraBold', fontSize: 14 }, statLabel: { color: c.textTertiary, fontSize: 7, marginTop: 2 }, startRoute: { minHeight: 42, borderRadius: 14, backgroundColor: c.accent, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, marginTop: 12 }, startRouteText: { color: c.onAccent, fontFamily: 'Manrope_800ExtraBold', fontSize: 12 }, privacy: { color: c.textTertiary, fontSize: 7, lineHeight: 11, textAlign: 'center', marginTop: 8 },
  driverMarker: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#3D8DFF', borderWidth: 4, borderColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: .25, shadowRadius: 7 }, hazardPin: { width: 34, height: 34, borderRadius: 17, borderWidth: 3, borderColor: '#fff', alignItems: 'center', justifyContent: 'center' },
});
