# Expo map fallback

Apple Maps remains the default on iOS. The native driving screen mounts an embedded MapLibre 5.24.0 / OpenFreeMap renderer only after a 20-second initialization timeout, a caught React map-render error, a map command exception, or a rejected/unresponsive native camera health check (8-second response deadline). Checks pause while backgrounded. The existing screen owns GPS, navigation, trip recording, hazard reports and camera throughout; switching does not restart a drive or log into the web app.

Account → Preferences → Map source offers **Apple** and **Web** on iOS. Hold the locate button to toggle in either direction without restarting a trip. Manual selections persist on this device and also choose the summary-map renderer. Automatic failure recovery is temporary and does not overwrite the preference. Hold locate to retry Apple after automatic recovery. Browser/Android settings identify Apple as unavailable instead of pretending to switch.

## Boundaries

- The installed react-native-maps iOS implementation emits `onMapReady` when rendering starts; it does not expose every MapKit tile error. A native process crash cannot be recovered by a React error boundary. Universal automatic failure detection is not possible with this Expo Go API.
- OpenFreeMap still needs internet and functioning WebGL. It cannot restore missing GPS, camera permission, routing service outages, or the hazard backend.
- The backup uses Expo Go's supported react-native-webview 13.16.1. Pinned MapLibre JS/CSS load from unpkg; styles/tiles load from OpenFreeMap. No Cloudflare deployment or account credentials are loaded into the WebView. Native coordinates/route/marker labels are passed to the embedded renderer; normal map tile requests go to the tile provider.
- Attribution remains visible above the drive controls. On backup failure a retry panel appears; retries do not end the drive.

## Verification

`node --test tests/native-map-fallback.test.cjs tests/trip-map.test.cjs` exercises the HTML bridge, route data, heading wrap, marker direction, event-location filtering and gesture callbacks. Type checking and iOS export verify integration, not on-device rendering. Test on an iPhone in Expo Go: normal Apple Maps first, hold locate for Web, hold again for Apple, verify route/pins, pan and recenter, confirm camera/drive controls still work. Check both summary renderers and the saved settings choice. Test actual turns as a passenger, not while operating the phone as a driver.
