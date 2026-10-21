# CuboAI quick answers

Standalone web only. Presets are evaluated before model inference. Opening chat no longer loads WebLLM, even if its files are cached. A user may explicitly load general AI for the current session; hiding or leaving chat stops it. No dependency, model download, paid service, or weekly-limit reduction was added.

## Coverage

- Scores: current saved measured-trip average, meaning and limitations, unavailable readings, improvement guidance.
- Family: demo names, Child 1/Child 2/Parent scores, per-person sample trips/miles/minutes, invitation and sharing help. Never claims real tracking.
- Garage: selected vehicle and other saved vehicles, alternate wording, common vehicle typo, add/select/view/color instructions, diagnostic limitations.
- Profile: current Auth display name, edit/contact/password guidance; no credentials or inferred identity.
- Saved places: Home and Work text read from the signed-in account's existing local storage. Loading, missing and malformed data are explicit.
- Insurance: selected demo insurer, reporting mode/cadence, simulated savings/reporting and full-name confirmation guidance. Never claims actual discounts or submission.
- Trips: saved count/mileage, Activity and deletion guidance; no destructive chat actions.
- Camera: parked setup, saved calibration status, permissions, framing and unavailable-camera help.
- Map: destination workflow, map-source availability, GPS/speed limitations, explicit refusal to guess live next turns or ETA.
- Hazards, voice, privacy, settings, devices and general app help: read-only guidance with demo/preview boundaries.

Matching uses bounded text, keyword/phrase rules and normalization; it is not universal natural-language understanding. Unmatched questions without a model receive a clarification/menu instead of invoking GPU work. Family and common personal questions stay in the deterministic path. Several topics in one sentence or pronoun-only follow-ups may require a clearer question.

## Failure handling and privacy

General AI failures, empty responses or a 12-second timeout stop the worker and produce a labeled quick-help fallback. No automatic retries. A killed browser process cannot execute a JavaScript fallback; avoiding model loading is the primary protection, not a guarantee against every Safari crash.

Saved addresses and insurer details are not added to the model snapshot. Prior chat history is not automatically forwarded to the model, since it can contain address answers. Bounded chat text and notes now sync to the signed-in account while remaining locally cached; the optional model still receives only the current question, saved notes and the existing bounded account summary. Consequently, general-chat pronoun follow-ups do not carry prior chat context automatically. Account switching, drive start, quota and history-clear guards still apply.

The 100-attempt weekly counter is unchanged, including preset replies. Account > Preferences > CuboAI voice (under Map source) selects a browser-provided voice for Listen. The URI is saved per account on this browser; voices load via getVoices/voiceschanged. A missing voice or blocked preference storage falls back to default English. No model or voice assets are bundled. Native Expo is unchanged.

## Verification

The regression corpus includes 52 question phrasings, tested both directly and through a session whose model loader fails if called. Additional tests cover missing/malformed facts, account switching, stalled and failed inference, no automatic model load, and address exclusion from model context. These are automated checks, not an iPhone stability guarantee.

TypeScript check, production web export and all 76 tests passed. The local Chrome preview timed out, so rendered UI and iPhone Safari stability were not verified. Main JS bundle grew from 4,858,816 to 4,870,905 bytes (+12,089 bytes); local gzip comparison grew from 1,206,545 to 1,210,735 bytes (+4,190 bytes). Actual transfer compression depends on hosting/browser. No dependency or model assets changed.
