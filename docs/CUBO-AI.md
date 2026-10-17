# CuboAI — standalone framework

Status: framework only. No app route/button, model package, automatic download, microphone request,
Firebase chat write, paid inference API, or change to Expo main. Phone WebGPU/model testing is still required.

## Pieces

- `localState.ts`: versioned localStorage records keyed by Firebase Auth UID (UID is only an identifier;
  no Firebase database calls). Monday 00:00 UTC rollover preserves messages and saved notes.
- `session.ts`: 100 generation attempts per week, shared between text and voice transcripts.
  Failed/interrupted attempts count; one request per session at a time. Counter is reserved before inference.
  Counter is a soft UX limit, not billing/security enforcement; clock changes, clearing storage,
  multiple tabs or different browsers can bypass it. No cross-device sync.
- `webllmAdapter.ts`: injectable WebLLM engine adapter, explicit download consent and progress callbacks,
  capability errors, bounded replies and engine cleanup. No default model selected yet.
- `browserVoice.ts`: optional push-to-talk transcript into the composer plus explicit Play reply.
  No raw audio storage. Browser recognition may use the browser provider's servers; explain this before consent.
  Silence/permission denial/unsupported input must leave typing usable. Stops after 30 seconds.

## Future UI integration checklist

1. Verify a small model on the target iPhone, record its exact ID, download size, distributor, license,
   required attribution and real-world speed. Candidate to evaluate: Qwen2.5-0.5B-Instruct (Apache-2.0
   upstream); verify the chosen compiled MLC artifact as well. Do not assume every model is licensed alike.
2. Install/pin `@mlc-ai/web-llm` in **standaloneapp only**. Inject a lazy import into
   `createWebLLMFactory(() => import('@mlc-ai/web-llm'), testedModelId)` and verify structural typings.
   Model package/runtime installation is intentionally deferred until the phone test chooses the model.
   For production use a dedicated Web Worker adapter to avoid competing with the UI. No model loading at boot.
3. Create `CuboAISession` only after authentication, with current UID and active-drive callbacks that
   read the latest state, browser localStorage, and the model factory. Do not pass family/location records
   or auto-attach app data. There are no tools or app-control permissions in this framework.
4. Show local-only storage disclosure, model download consent/progress, unsupported/loading/error states,
   remaining attempts and the reset time. Display replies as plain text, never model-generated HTML.
5. Mount the eventual screen keyed by UID. On logout, account change, drive start, screen exit or page hide:
   dispose session and voice immediately, clear rendered messages, and ignore late results. Guards already
   reject subsequent sends and late model replies. The UI must wire lifecycle disposal before release.
6. Voice consent is separate from model consent. `listen` only fills the editable composer; user confirms
   Send. Both voice/text go through `session.send`. `speak` is an explicit user tap. Do not promise background,
   always-listening or Siri-like full-duplex voice. Never use this for distraction safety alerts.
7. Expose user-editable saved notes (`remember`), Export, and confirmed Clear history. Notes are explicit
   memory, not silently inferred personal facts. Automatic conversation summarization is not implemented.
8. Test account switching mid-download/mid-generation, denied mic/storage, low memory, dropped GPU,
   private browsing, week rollover, page hide and current iPhone Safari before enabling the UI.

## Retention and privacy

The latest 200 messages are retained; older messages are pruned as new messages arrive. Explicit saved notes
(2,000 characters) are retained separately until cleared. Prompt context uses only the latest eight messages,
up to 1,000 characters each, plus notes. This is not unlimited or perfect memory. Export before pruning if needed.
History clearing keeps usage; browser Clear Site Data removes everything and may require re-downloading models.
Storage failures surface errors rather than claim success. Same-origin localStorage is **not encrypted** and
is not an access-control boundary against device/browser-profile access or XSS. Account keys prevent accidental
mixing in the app; use separate OS/browser profiles for shared-device confidentiality. Model weights are public
and may be cached across accounts; conversations are not part of model weights. No training occurs here.

No paid AI API is required. Device data, battery, model host availability, hosting quotas and model licenses
still apply. Browser speech recognition is a separate service and is not guaranteed offline.

References: https://webllm.mlc.ai/docs/user/basic_usage.html,
https://webllm.mlc.ai/docs/user/advanced_usage.html,
https://huggingface.co/Qwen/Qwen2.5-0.5B-Instruct
