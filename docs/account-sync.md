# CUBO account sync

CUBO keeps an offline copy on each device and mirrors bounded, user-owned records to Cloud Firestore under `users/{uid}/sync/{domain}`. The signed-in Firebase UID is the ownership boundary. A client cannot read or write another user's sync documents.

## Synced

- saved vehicles and selection;
- Home, Work, and the three most recent chosen destinations;
- insurance demo preferences;
- Blocked Apps policies and preview notices;
- up to 50 recent completed drives, with sampled route points, safety events, and bounded text transcripts;
- up to 200 recent Cubo Assistant text messages plus saved notes and the weekly counter.

Existing local records seed an empty cloud record. When a cloud record already exists, domain-specific merging preserves unique vehicles, destinations, policies, drives, and assistant messages. Remote preference values win where merging would be misleading. Local persistence remains the offline source and a failed cloud request never erases it.

Each device also stores the last cloud payload it successfully confirmed. That marker distinguishes a clean cache from a real offline edit: clean devices accept newer account data, while offline edits and deletions are uploaded after reconnection instead of being silently replaced or resurrected. First-time migration merges only when that device already had a real local record; fresh installs take the account copy.

## Never synced by this layer

Camera frames, raw microphone audio, active-drive location updates, OS permission state, camera calibration, CUBO Cruise pairing, map tiles, WebLLM model files, interrupted-message drafts, and profile photos remain device-local. Calibration and permissions are intentionally device-specific. Avoid Firebase Storage so the project can remain on Spark without enabling billing.

## Free-tier controls

Each domain is a single versioned JSON envelope with a rules-enforced maximum size. Writes are debounced, completed drives sync instead of live GPS samples, and arrays are bounded before upload. The project must remain on Firebase Spark to prevent billable overage. If Firestore is unavailable or quota is exhausted, CUBO continues locally and retries after the app is reopened or the data changes again.

The Firestore database is Standard edition. Deploy `firestore.rules` before releasing client code; otherwise the existing catch-all denial blocks all sync writes.
