# Attention monitoring and recovery

Both branches share the attention policy, account fixes, and trip checkpoint format.
Their map and hosting configurations remain separate.

## Camera pipeline

- Web: MediaPipe Face Landmarker processes a 640px camera stream locally, up to 5 samples/second.
- Expo: CameraView captures sequential low-quality samples. An on-device WebView runs the same landmark model. Each camera-created temporary file is deleted immediately; base64 is passed only to the local WebView, not a remote inference endpoint.
- Internet is needed to load the pinned model/runtime. No fresh samples, permission denial, backgrounding, and model failures are explicitly unavailable/paused, never interpreted as attentive driving.
- Physical iOS/Android testing is still required for capture latency, thermals, WebView compatibility, and usable alert delivery. This is experimental monitoring, not a validated safety system.
- Calibration requires eight distinct, eyes-open, stable face samples spanning at least three seconds. It stores numeric baselines, not photos, per account on this device. Recalibrate after moving the mount. Old framing-only timestamps are intentionally not accepted as valid calibration.
- Alerts require sustained relative head movement (2.2s) or eye closure (1.8s), a fresh GPS fix and speed >=3mph. These are heuristics, not a diagnosis of drowsiness or a determination of where the eyes are looking. There is no phone-object detector.
- Each episode generates one event until the condition clears. Events inherit only recent GPS coordinates. Score is the proportion of measured moving time classified as attentive, with at least five measured seconds; unobserved time is excluded and coverage is shown.
- Test synthetic measurements or use a parked/passenger test. Never deliberately close your eyes or look away while driving to test this.

## Storage and accounts

An ordered, atomic per-user checkpoint contains finished and active trips. On restart, the interrupted trip is finalized through the latest saved checkpoint and labeled Recovered in Activity. It does not restart the camera, invent offline route points, or count offline duration. A sudden kill can lose the latest in-flight write. Storage failures are surfaced; this is local recovery, not cloud backup.

Insurance preferences use `cubo-insurance:<uid>`. Ambiguous legacy device-wide settings, including consent, are not assigned to any account. Users select their insurer once again.

## Email-change deployment

The app reloads Firebase Auth, refreshes its ID token, and synchronizes a changed verified email before saving profile/account details. The checked-in user update rule permits an email change only to the authenticated token email and only when verified; UID ownership, validation, and immutable creation time remain required.

**GitHub/Cloudflare deployment does not deploy Firestore rules.** Before release, inspect the existing live rules in Firebase Console -> Firestore Database -> Rules. In the existing `/users/{userId}` update rule, retain the authenticated email equality and replace the old immutable-email condition with:

```text
&& (request.resource.data.email == resource.data.email || request.auth.token.email_verified == true)
```

Preserve all other live rules, especially roadReports/family rules. Do not deploy the repository's user-only rules over a richer live ruleset. Test in the Rules Playground/emulator: owner/unchanged email allowed, owner/verified Auth-matching new email allowed, unverified change denied, another user's document denied, arbitrary email denied. Then test a real verified email change and subsequent account save with a designated test account.
