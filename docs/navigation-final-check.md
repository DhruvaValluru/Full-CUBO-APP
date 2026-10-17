# Navigation hardening check — 2026-10-17

## Fixes

- Keep primary tabs available after scrolling and returning from detail pages (still hidden during an active drive).
- Dismiss the keyboard when switching tabs; do not navigate again when reselecting the active tab; preserve tab press and long-press events.
- Use immediate web tab transitions to reliably detach inactive screens. Preserve native transitions and honor reduced motion.
- Add the missing Back button when Activity is opened as Drive history from Account.
- Return Home when Family is opened directly through the familyInvite entry path with no prior screen.
- Preserve the app subtree when the web phone frame crosses its responsive breakpoint, preventing navigation/auth/drive providers from remounting.
- Expose selected-tab state and settings-row/back-button labels to assistive technology.
- Stop saved-address GPS/search subscriptions when that screen loses focus.
- Allow native startup to continue with fallback text if font loading reports an error. Standalone web retains its existing reload/recovery screen.

## Verification

- Main: TypeScript check and 53 tests passed.
- Standalone: TypeScript check, 135 tests, and production web build passed.
- Eight added regression tests cover tab dispatch, prevented/long presses, active-drive tab lock, persistent navigation, back paths, startup gates, address cleanup, frame ancestry, and accessibility wiring.
- Signed-in Chrome production-preview checks: repeated Home/Map/Activity/Account switching; Drive history round trip; Family, Insurance and Devices round trips; leaving a typed address search; Garage -> Vehicle details -> Home; Assistant disclaimer/license -> chat -> Home.
- Browser resize 390 -> 1200 -> 390 preserved Account. At 390 x 844, all four tab centers remained inside the viewport and hit-testable after Account scrolling.
- Direct familyInvite entry -> Back reached Home.
- Final Chrome preview error log was empty. No drive, hazard, vehicle, or saved-address data was created/changed during these checks.

## Limits

This is a targeted final navigation review plus the existing full automated suite, not proof that every feature is bug-free. No physical iPhone/Expo Go session, moving drive, live GPS accuracy, camera detection, or voice recognition was tested in this pass. Native behavior is covered by shared-code inspection/typechecks/tests, not a device run. The screenshot backend timed out; browser verification used DOM/accessibility state and hit testing.
