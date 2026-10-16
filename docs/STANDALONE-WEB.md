# CUBO standalone web deployment

`standaloneapp` is the web deployment branch. `main` preserves the Expo Go version.
Expo still builds the source; visitors do not need Expo Go or a running laptop.

## Cloudflare Pages (free plan)

1. Open https://dash.cloudflare.com/ and choose Workers & Pages, Create application,
   then Pages / Connect to Git (not a Workers deployment).
2. Authorize only the CUBO-APP-CAC GitHub repository if possible.
3. Select production branch `standaloneapp`, framework None, build command
   `npm run build:web`, output directory `dist`, root directory blank.
4. Set build environment variable `NODE_VERSION` to `22.16.0`.
5. Under preview branch controls, disable automatic previews for other branches
   so `main` and `old-app` do not trigger unsupported web builds.
6. Deploy. Use the assigned HTTPS `*.pages.dev` URL; no paid domain is required.
7. In Firebase Authentication settings, add that exact hostname to Authorized
   domains. Never weaken Firestore rules to fix a login or permissions error.
8. On iPhone, open the HTTPS URL in Safari, Share, Add to Home Screen. Enable
   Open as Web App if Safari offers it. Launch CUBO from its new icon.

No secret keys or Cloudflare tokens belong in this frontend or in EXPO_PUBLIC_*
variables. The Firebase client configuration is public by design; authorization
depends on Firebase Authentication and deployed security rules.

## Verification

Run `npm ci`, `npm run build:web`, `npm run test:web-build`, and `npx tsc --noEmit`.
Test the deployed HTTPS URL on a physical iPhone, both in Safari and from its
Home Screen icon. Check login persistence, navigation, keyboard, safe areas,
camera and GPS permissions. Then switch Wi-Fi off and repeat on cellular while
the laptop is off. Set up and interact only while parked.

## Current boundaries

- This initial export is online-only. There is no offline/service-worker cache.
- Web maps currently display a schematic route, not native Apple Maps or a
  validated turn-by-turn navigation system.
- Web camera calibration still needs implementation; the existing web preview
  component does not provide calibration-ready or frame-capture behavior.
- iOS may suspend camera/GPS when backgrounded or locked. Do not rely on
  background monitoring, and do not treat this prototype as a safety device.
- Demo family locations, insurance savings and notifications remain demos.
- Static Pages hosting does not run `server/family`. Real family APIs, email,
  feedback delivery and SMS require separately configured backend services.
  Leave EXPO_PUBLIC_FAMILY_API_URL unset until a secure hosted API exists.
- Address/routing providers and Firebase need connectivity and have their own
  availability, usage policies and limits. Free frontend hosting does not remove
  those limits.

Rollback: use an earlier successful Pages deployment. Do not merge web-specific
changes into `main` unless explicitly requested.
