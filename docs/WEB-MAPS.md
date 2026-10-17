# Standalone maps

The web Map tab uses MapLibre GL JS 5 with OpenFreeMap's Liberty (light) and Dark styles. No key or signup is required. Native Expo's main branch is unchanged.

Open the Cloudflare app, select Map, and use the location target control. Allow browser location access when prompted. You can pan and zoom without location permission. Existing destination search and OSRM route previews remain separate services, not guaranteed navigation or traffic guidance.

Map tiles require internet and contact OpenFreeMap for the viewed area. Attribution must remain visible. MapLibre's bundled stylesheet is required for controls and attribution; the production export must include its CSS. Map resources are disposed when the component unmounts. Denied GPS and network failures show guidance instead of a silent blank map.

Phone check: test Safari location allowed/denied, pinch zoom, light/dark appearance, route preview, leaving/reopening the tab, and loss of network. Public tile hosting has no uptime guarantee. Do not treat this preview as a safety-critical navigation system.
