# CuboAI — standalone web

Home's chat icon opens CuboAI. Expo main is unchanged.

## First use

Read the safety notice; optionally hide it for this account in this browser.
Tap Load CuboAI to explicitly download/load Llama-3.2-1B-Instruct-q4f32_1-MLC
through pinned @mlc-ai/web-llm 0.2.86. HTTPS and WebGPU are required.
Use Wi-Fi for the large download. Other websites' downloads are not shared.
No paid AI API or API key is used. Model licenses and host availability still apply.
License and attribution ship under public/licenses; the UI displays Built with Llama.

## Usage and privacy

- 100 generation attempts per account/browser/week; failed attempts count.
- Monday 00:00 UTC resets usage, not history or explicit saved notes.
- Circle: above 80% green, 61–80% orange, 21–60% yellow, 0–20% red.
- Zero disables input. This is a soft local allowance, not secure billing enforcement.
  Clock changes, clearing data, multiple tabs and other browsers can bypass it.
- Latest 200 messages retained; latest two bounded messages form model context.
  Explicit editable notes retain 2,000 characters; no automatic perfect memory.
- Storage keys include authenticated UID. No Firebase chat writes or cross-device sync.
- Only this account's completed-trip counts, distances and measured experimental
  focus-score average are supplied. No precise routes, camera images, family records or email.
- History is unencrypted browser storage. Account separation prevents accidental mixing,
  not access by someone with this browser profile or an XSS vulnerability.
- Public model weights may be cached across accounts; conversations are not model weights.
- Clear history confirms first and preserves usage.

## Voice and lifecycle

Microphone requests separate consent; browser recognition may use provider servers.
Transcript fills the editable composer, then user presses Send.
Listen on a reply uses browser speech synthesis. No raw audio saved.
Unsupported or denied microphones leave typing available. This is tap-to-talk,
not continuous full-duplex voice. Same-origin microphone policy permits requests;
it does not grant microphone permission.

Active drives disable CuboAI. Account change, exit, page hide and drive start
stop voice and terminate the dedicated inference worker, including unfinished loads.
Late replies cannot persist. Model runtime is bundled separately by esbuild and
loaded only on Start CuboAI. Memory-saving mode uses a 2,048-token context,
128-token replies, bounded notes/history and 1,000-character user prompts.
Worker separation reduces main-thread blocking but cannot guarantee against iOS
terminating a page for memory pressure. No inference fallback runs on the UI thread.
The existing model and default Cache API backend are preserved; cached weights
are reused when present. Startup reports cache loading versus download progress.
Safari may evict caches. The app cannot guarantee permanent device storage.
An interrupted prompt is saved under this account's key before inference,
restored on re-entry without auto-send, and removed on success or confirmed history clear.
Physical iPhone Safari model and voice integration still needs device testing.

## Validation

Run npx tsc --noEmit, node --test tests/*.test.cjs, and npm run build:web.
Tests cover account isolation, lifecycle races, quota rollover, thresholds and unmeasured scores.
They do not prove microphone recognition or GPU performance on every device.
