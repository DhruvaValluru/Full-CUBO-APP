# Cubo Assistant and Cubo Voice Assist

Standalone web only. User-facing branding changes do not rename account storage keys, internal route IDs, or model caches; existing history, memory notes, notice preference and quota are preserved.

- Mic: speech-to-text dictation. Adds to the draft (up to 1,000 characters), never sends automatically. User reviews/edits and presses Send.
- Waveform: Cubo Voice Assist. Separate explicit consent explains automatic submission, browser speech processing, selected read-aloud voice, local history and shared weekly quota. While active, say Hey Cubo before new questions; ordinary follow-ups, spoken off confirmation and best-effort stop-talking interruption reuse the drive conversation controller. Tap the waveform to stop immediately.
- These capture modes are mutually exclusive. Switching modes, opening settings/license, navigation blur, hiding the app, account changes and starting a drive stop the chat microphone/playback. Permission/audio errors appear in chat. No microphone or model activates automatically.
- Chat voice uses only presets, even if the optional model was loaded. It shares saved-account data, history (200-message cap) and allowance with typed chat. No new storage service or model download. The full answer remains in the thread; spoken replies are short.
- Shared app-question normalization handles polite prefixes, vehicle wording, first/second child aliases, and family follow-ups. Both drive and chat call the same saved-app answer functions. Drive-only GPS, route and hazard mutations remain restricted to the drive handler. Chat gives an explicit limitation for live-route requests.
- The Llama attribution and complete bundled license are retained. Clicking the footer opens a local text panel, not a new browser tab. Back to Cubo Assistant or Escape closes it without navigating or clearing the draft/history. Failed license fetches show an error and still allow closing.

Validation: command/session tests cover no model inference for voice, shared data/phrasing, family context, voice off confirmations, account isolation, quota, no live-drive data, dictation not auto-sending, retained attribution and the back control. Browser speech/permission differences still require a parked-phone check; tests are not an iPhone microphone certification.
