# Drive voice commands (standalone web)

Supersedes the inert AI toggle described in drive-voice-preview.md. No native/main change.

Tap AI, review the privacy notice and agree. The browser transcribes one utterance, the shared account preset router or drive command router answers, and the selected Voice Preference speaks. Listening resumes after speech finishes. Sessions end after 60 seconds, 30 seconds without a recognition result, an error, screen/account/trip changes, hiding the app, an attention warning, or Stop listening. There is no always-on wake word or background listening.

Examples: my selected vehicle; who are my kids; Child 1 score; and their score; my insurance; my home address; my name; next turn; how fast am I going; how am I doing this drive; how long have I driven; monitoring status; repeat that; stop listening.

Hazards: report debris/object, police, or crash; then confirm or cancel. Confirmation expires after 20 seconds and is single-use, bound to the original trip and fresh original GPS position. Reports are trip events only, not published to the community. Other mutations, including ending a drive, are not supported. ETA is explicitly unavailable. Family data is explicitly demo data. Missing measurements are never replaced with an invented score or turn.

No WebLLM/model invocation, new dependencies, chat quota consumption, audio recording, or persisted voice transcript. Saved account facts are read only for the signed-in user; they may be spoken aloud. Recognition may send audio to the browser provider and may require connectivity. Browser/device support, microphone permissions, road noise, audio policies, battery and memory costs vary. This is bounded command matching, not unrestricted language understanding. Unsupported questions receive clarification, not a model fallback. No guaranteed all-phone support or crash immunity.

Verify on a parked phone: allow microphone; ask vehicle/kids/score and verify speech; ask a second question after the reply; confirm/cancel a hazard and inspect Activity; test stop, mute, denied permission and app backgrounding. Do not interact with the phone while driving. Automated command/lifecycle tests do not certify iPhone microphone/audio behavior.
