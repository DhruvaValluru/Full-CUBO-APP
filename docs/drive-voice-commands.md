# Drive voice commands (standalone web)

Supersedes the inert AI toggle described in drive-voice-preview.md. No native/main change.

Tap AI, review the privacy notice once per drive and agree. The accepted trip ID is stored per account in sessionStorage (in-memory fallback if storage is blocked). This never auto-enables the microphone. Activation speaks an audible greeting directly from the tap to establish playback. Replies use the selected Voice Preference. Missing speech events time out visibly instead of leaving the control stuck.

Voice stays enabled without a 60-second cap. It alternates recognition and speech with a 650ms restart delay; ordinary silence restarts recognition. Permission/network/audio errors, three immediate recognition endings, screen/account/trip changes, hiding the app and attention warnings turn it off. There is no background listening. Safari may still require another gesture or interrupt recognition; all-phone reliability is not claimed.

Say Hey Cubo before a new question. A 20-second follow-up window after each reply accepts questions or confirmations without the prefix. Other idle transcripts are discarded without a response. This is browser transcription followed by phrase matching, NOT a low-power on-device wake-word engine: audio, including surrounding conversation, may be processed by the browser provider while enabled. No new model is loaded.

Tap the enabled icon to turn off immediately. Spoken requests such as Hey Cubo turn off voice assist, turn voice assistant off, mute yourself, or stop listening ask for yes/no confirmation. Confirmation is single-use and expires after 30 seconds; it cannot confirm a pending hazard at the same time. Re-enable manually by tapping the icon, without showing the notice again in the same drive.

Examples: my selected vehicle; who are my kids; Child 1 score; and their score; my insurance; my home address; my name; next turn; how fast am I going; how am I doing this drive; how long have I driven; monitoring status; repeat that; stop listening.

Hazards: report debris/object, police, or crash; then confirm or cancel. Confirmation expires after 20 seconds and is single-use, bound to the original trip and fresh original GPS position. Reports are trip events only, not published to the community. Other mutations, including ending a drive, are not supported. ETA is explicitly unavailable. Family data is explicitly demo data. Missing measurements are never replaced with an invented score or turn.

No WebLLM/model invocation, new dependencies, chat quota consumption, audio recording, or persisted voice transcript. Saved account facts are read only for the signed-in user; they may be spoken aloud. Recognition may send audio to the browser provider and may require connectivity. Browser/device support, microphone permissions, road noise, audio policies, battery and memory costs vary. This is bounded command matching, not unrestricted language understanding. Unsupported questions receive clarification, not a model fallback. No guaranteed all-phone support or crash immunity.

Verify on a parked phone: hear the activation greeting; allow microphone; ask vehicle/kids/score and verify speech; ask a second question after the reply; wait over 60 seconds then say Hey Cubo and another question; confirm/cancel a hazard and inspect Activity; test spoken stop with yes/no, manual off/on without another notice, a new drive with a new notice, denied permission and app backgrounding. Do not interact with the phone while driving. Automated command/lifecycle tests do not certify iPhone microphone/audio behavior. Persistent recognition consumes more battery/network than the former 60-second sessions; runtime costs have not been measured on the user's phone.
