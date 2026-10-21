# CUBO Cruise and account groundwork

## Vehicle recognition

Use Bluetooth Low Energy for nearby recognition. Cellular/Wi-Fi are not reliable substitutes for detecting which cabin the phone entered.
The firmware must advertise a stable service identifier, and pairing must authenticate a unique box identity.
Persist the verified box-to-vehicle binding, never use the advertised display name as identity.

The pure matcher in src/features/devices/cruiseProximity.ts requires three authenticated samples across two seconds, ignores stale signals and refuses ambiguous nearby cars. Thresholds are initial tuning values, not calibrated distance estimates.
The transport interface is ready for a native BLE adapter. Expo Go does not include react-native-ble-plx; adding it requires a custom development build and physical-device testing. No fake auto-connection is enabled.
Use foreground recognition first. Background recognition needs platform permissions, restricted iOS scanning behavior and firmware testing.

Sources: https://expo.dev/blog/how-to-build-a-bluetooth-low-energy-powered-expo-app
https://developer.apple.com/documentation/corebluetooth/cbperipheral/rssi

## Account details

New registrations collect date of birth and a country-code phone number. Under 18 is a self-declared minor profile; this is not identity verification or an authorization claim.
Phone numbers remain unverified. Guardian invitation delivery and acceptance are not enabled.
Supplemental details are currently scoped to the signed-in UID in local AsyncStorage, not cloud-synced.
The existing deployed users schema only permits six profile fields; adding private account data requires an owner-only cloud schema/rules migration and tests.
Never trust a client-side adult label to grant access. Never enable family location sharing without consent and server-enforced membership.

## Places and artwork

Saved addresses, recent destinations and vehicle selections keep a per-account offline copy and sync through the signed-in Firebase account. Camera calibration, permissions, profile photos and CUBO Cruise bindings remain device-specific.
Photon provides GPS-biased suggestions and OSRM provides prototype routes; public endpoints have no availability guarantee and are not a production navigation SLA.
The vehicle artwork is a generic generated compact-car illustration bundled into the app, not a paid runtime AI request or an exact manufacturer model.
