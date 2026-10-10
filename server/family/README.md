# CUBO family service

This is a local/single-server implementation, not a deployed cloud service. The app does not send invitations until `EXPO_PUBLIC_FAMILY_API_URL` is configured. No Firebase rules or billing plans were changed.

## Behavior

- Firebase ID tokens are checked through Firebase Authentication, using this project's web API key. Never replace this with a client-supplied UID.
- Invitation is bound to the recipient's exact account email; joining requires a verified email and explicit acceptance. An invitation alone grants no access.
- Only the organizer can read a consenting member's driving summaries. Routes and camera images are omitted.
- Leaving deletes that membership and its shared summaries immediately and records an organizer notification.
- Notifications are polled while the app is foregrounded. These are not OS push notifications.
- Hardware diagnostics and camera previews require a real Cruise adapter and firmware. No simulated health data is supplied.

## Local testing

Use Node 22 or newer. Set `FIREBASE_WEB_API_KEY` to the key already in `src/lib/firebase.ts`, then run `node server/family/server.mjs`. The server binds to localhost:8082 by default.

For phones, explicitly bind `CUBO_HOST` to your laptop's LAN address and set `EXPO_PUBLIC_FAMILY_API_URL` to `http://<laptop-LAN-IP>:8082` before restarting Expo. Restrict firewall access to your private test network. HTTP is only for trusted local testing; production requires HTTPS, request limits, durable transactional storage, backup/retention policy, and monitoring. Do not expose this local development server publicly.

`CUBO_APP_ORIGIN` restricts browser clients (default `http://localhost:8081`). Do not set it to a wildcard. State is stored in `.local-family/state.json`, excluded from Git. Protect that directory; it contains account emails and shared summaries. The local server is not a production-scaled database.

## Invitation email

Without an email sender, invitations remain in-app only and explicitly show `Email sender not configured`. To enable the optional Resend adapter, configure `RESEND_API_KEY`, `CUBO_EMAIL_FROM` (verified sender) and `CUBO_APP_URL`. This code does not create a provider account or enroll in billing. Check provider limits before enabling it.

The emailed link opens the app's web welcome/login flow; review the invitation in Your family after signing in. Native universal links require a published HTTPS domain, OS association files, and a development/release build; Expo Go is not a production deep-link deployment.

Account ages are self-declared. This service is a consent-based family sharing implementation, not proof of a legal guardian relationship. Production parental management must also enforce organizer eligibility on the server and handle legal/privacy requirements separately.

## Verification

`node --test server/family/domain.test.mjs` tests approval, recipient checks, verified-email checks, outsider denial, leave revocation and notification, and private-data filtering. Real Firebase identity lookup, email delivery and two-phone network setup need live integration verification.
