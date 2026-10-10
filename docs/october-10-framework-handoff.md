# CUBO Oct 10 implementation and remaining connections

## Implemented app behavior

- The original 3D hatchback is restored. Five paint finishes reuse the same model: white, graphite, forest green, midnight blue, burgundy. Edit/add vehicle previews colors; saving persists the selected finish per account on this device. These are representative illustrations, not manufacturer-accurate renders or arbitrary RGB recoloring.
- Home no longer duplicates Activity. Activity has per-trip delete and clear-all confirmations; no active drive is deleted.
- Account details now save to the owner's Firebase `users/{uid}.accountDetails` and read back through a snapshot listener. The save label shows Updated only after server acknowledgement; rejected writes do not change local details. Account completeness reminder disappears once the crucial fields are present. Leaving Edit profile discards unsaved form drafts.
- Account has an optional persisted dark-mode switch. App screens use reactive charcoal/green tokens, including native map appearance, forms, dialogs, camera-check chrome, trips and navigation. Narrow web previews render without the decorative phone frame. Native installed builds need rebuilding for the automatic interface-style config.
- Edit profile includes DOB, formatted phone/country flags, secure current-password confirmation for Firebase email/password changes. Email uses verifyBeforeUpdateEmail; the user completes verification. Phone is unverified and age is self-declared.
- Help has bug/feedback forms. Without a backend, submissions are saved as device-local drafts and explicitly not emailed. With the optional service, feedback is recorded and can use a configured delivery adapter.
- About has a marked placeholder founder bio, cubocruise.com, and intentionally unconfigured social buttons.

## Family framework

The optional service is not deployed or connected by this task. Configure EXPO_PUBLIC_FAMILY_API_URL only after running and securing the service.

Original organizer alone can promote/revoke Parent/Guardians or remove members. Parent/Guardians can read consenting minors' summaries and approve/decline birth-date requests, but cannot change membership/roles. Members can leave. Removal/leave revokes access immediately in the server model. Account details are private; members see account classification, not each other's DOB/phone.

New accounts initialize private account details before joining; organizing/promoting requires an adult self-declared DOB server-side. Unknown DOBs on linked legacy accounts are blocked from self-seeding adult ages. Their first DOB can be submitted with a phone number as a parent-reviewed request; it is not applied before approval.

Server routes: POST /account/details, /family/age/request, /family/age/review, /family/guardian, /family/remove, /support/feedback. Existing authenticated invitation, leave and notifications routes remain.

Feedback adapter is opt-in: RESEND_API_KEY, CUBO_EMAIL_FROM, CUBO_TEAM_EMAIL. Invitation email separately also requires CUBO_APP_URL. No provider enrolled, payment enabled, or email sent during implementation. Social URL configuration lives in src/components/AboutCubo.tsx.

## Shared hazards: NOT LIVE YET

Verified live Firebase Standard database on Spark: current rules permit users/{uid} only; roadReports is denied. Two phones cannot share reports until the proposed rules AND composite index are tested and published.

App code: 300m ahead warning (route-proximity filtered), nearby/passed survey at about 55m, dismiss unanswered survey after 10 seconds, exclude submitter, one atomic confirmation per Auth UID, retire after 10 responses or 30 minutes. Prompt sits inside measured bottom panel so PiP lower corners adapt.

Files: firebase.hazards.proposed.json, firestore.hazards.proposed.rules, firestore.hazards.indexes.proposed.json. The hazard proposal is not deployed. `firestore.rules` now includes the separately published owner-only account-metadata schema; `firebase.json` still targets it. Proposal also allows verified Auth email changes to update the owner's stored profile email; current deployed immutable-email rule needs that migration before cloud name updates can keep working after email changes.

Attempted CLI read-only checks and dry-run hit CLI authentication/network limitations; the hazard proposal was not compiled or deployed. The account-metadata-only rules were subsequently compiled through the Firebase console simulator and published on Oct 10; simulated anonymous and cross-account reads were denied and owner read allowed. See hazard-rule-analysis.md and hazard-security-review.json. Do not present structural review or unit tests as emulator/integration verification.

30-minute expiry hides reports from the map and blocks new confirmations; it does NOT physically delete Firestore documents. A trusted retention cleanup and per-user abuse quotas remain production work.

## Verification boundaries

21 unit tests pass, including server-acknowledged account save ordering and rejected-write behavior. TypeScript passes. Browser checks verified dark/light toggling, discarded unsaved name drafts, profile wording and distinct bug/feedback placeholders. No real user's DOB/phone was entered or modified for QA.

Unit tests cover DOB/phone logic, drive timing, PiP corners, approach direction, expiry/response limits, consent/revocation, role boundaries, birthday review, private-field filtering and feedback validation.
Live driving, native map/PiP animation, real Firebase credential changes, real delivery and two-phone sharing need device/integration testing after connecting services.
