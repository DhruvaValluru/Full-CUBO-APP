# Guided calibration check

The calibration screen in both branches uses the existing on-device attention detector.

## Flow
1. User confirms they are parked; collect at least eight stable, eyes-open samples spanning three seconds.
2. User starts the distraction exercise. A sustained head turn uses the same 2.2-second threshold as driving.
3. On an actual head-turn event, speak "Distraction detected. Look forward again."
4. Observe at least 1.2 seconds forward-facing with eyes open.
5. User confirms hearing the alert, then save the baseline and guidedTestPassed on this device for the signed-in account.

This is a calibration-only sandbox. It does not request GPS, create trips/events, or update focus scores.
The real drive monitor still requires reliable GPS and at least 3 mph.
An active trip blocks calibration. Leaving/backgrounding interrupts the exercise and stops camera/audio.
Missing faces, delayed/duplicate frames and long gaps cannot complete the exercise.
Unsuccessful attempts leave the previous saved baseline intact.

## Platform details
- Web uses browser speech, primed from a user tap. Hear alert allows a manual retry.
- Native uses expo-speech 57.0.3, supported in Expo Go. The native drive warning now uses actual speech too.
- Device volume, silent mode, Bluetooth output and browser audio policies can prevent audible playback;
  software playback callbacks do not prove the user heard sound.
- No additional AI model, paid API, audio recording or cloud calibration storage.
- Web calibration preview uses contain; normal drive preview retains cover.
- The fake fixed face outline/dimming were removed. Instructions scroll independently of the bottom action.

## Verification
- 71 main tests and 152 standalone tests pass; both TypeScript checks pass.
- Final Expo iOS export and standalone web production build pass.
- New deterministic tests cover baseline stability, actual event/recovery dwell, lost faces,
  stale/duplicate/future samples, timeouts, audio completion/failure/cancellation, and drive threshold isolation.
- Chrome checked at 375x812 and 812x375: no horizontal overflow, reachable fixed primary control,
  light/dark controls, permission failure/retry state, Hear alert invocation, and return to Home.
- No live camera frames were available in this check; no real head-turn exercise was completed or calibration saved.
- Screenshot capture timed out. Physical iPhone appearance, detector sensitivity and audible speaker output
  still require a parked phone test. Build/unit checks are not a road-safety certification.
