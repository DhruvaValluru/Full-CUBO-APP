# Standalone maps

The web Map tab uses MapLibre GL JS 5 with OpenFreeMap's Liberty (light) and Dark styles. No key or signup is required. Native Expo's main branch is unchanged.

Open the Cloudflare app and select Map. Allow browser location access when prompted. The full-screen map centers on a fresh GPS fix. Select a search suggestion, wait for the route, tap Start drive, then confirm the camera. A selection is retained if GPS is still pending; Enable location retries the browser watcher. You can pan and zoom without location permission.

The web screen ports the native driving UI: maneuver arrows and distance, driver marker, heading/pitch/zoom follow mode, recenter, camera PiP, speed and trip timer, hazard sheet and confirmation prompts, end drive and summary. The renderer adapter uses MapLibre while the native MapScreen remains unchanged. Browser GPS directly uses and cleans up its browser watch ID, avoiding Expo's web subscriber-ID mismatch and permission-query compatibility issues.

OSRM supplies route geometry and maneuver steps; Photon supplies search. These public services are independent of OpenFreeMap. They have no production navigation guarantee, and this does not add traffic, voice guidance, offline routing, or reliable screen-locked/background tracking. Keep the browser foregrounded. Community hazard sharing still requires functioning Firestore permissions/indexes; failures remain visible and local trip reports remain available. Do not interact with the UI while driving.

Map tiles require internet and contact OpenFreeMap for the viewed area. Attribution must remain visible. MapLibre's bundled stylesheet is required for controls and attribution; the production export must include its CSS. Map resources are disposed when the component unmounts. Denied GPS and network failures show guidance instead of a silent blank map.

Phone check: test Safari location allowed/denied, pinch zoom, light/dark appearance, route preview, leaving/reopening the tab, and loss of network. Public tile hosting has no uptime guarantee. Do not treat this preview as a safety-critical navigation system.
