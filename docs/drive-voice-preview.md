# Drive voice interface preview

Scope: standaloneapp only. No speech recognition, wake word, commands, model changes or quota changes in this iteration.

## Direction contract

THESIS: Prepare voice controls without distracting from navigation or implying that unconnected features work.
OWN-WORLD: Existing Manrope typography, theme surfaces, green accents and CUBO asset. No new visual identity.
STORY: After confirming the camera, optionally test microphone sound levels while parked. Continue or skip. The microphone stops before starting the drive.
FIRST VIEWPORT: Existing drive map and controls remain. A compact CUBO preview switch sits in the upper-right portion of the bottom panel, clear of the draggable camera and locate control. The optional setup dialog centers within the viewport and scrolls on small screens.
FORM: Local extension of existing Operate surfaces; no concept seed needed. A real horizontal meter rather than simulated animation.
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Lifecycle and integration boundary

- Meter uses getUserMedia only after Test microphone. Audio is analyzed locally, not recorded or uploaded.
- Stop on close, continue, skip, hidden page, unmount, or after 15 seconds of testing. Late permission grants release their tracks.
- Drive switch is a UI preview, explicitly not listening; no microphone or WebLLM is started by it.
- Future voice implementation must wire real listening state, permissions, interruptions, account isolation and confirmed actions. Do not reinterpret this UI state as microphone consent.
- Existing cubo-logo.png is reused; no new image or model assets.

## Verification and limits

This is an ordinary extension, not a new visual world: existing theme tokens and assets are preserved; no new global DESIGN.md is needed. Source review and documentation review completed, with an error-text contrast correction. Typecheck, web build and 69 tests passed. The setup heading and buttons use the existing separately registered Manrope faces.

Chrome inspection failed with a browser connection timeout; the alternate browser was not signed in. No rendered approval is claimed. Small-screen scrolling, camera/locate separation and focus restoration are source-supported design intentions, not visually verified results. Real iPhone microphone permissions and camera/mic coexistence still need device testing.
