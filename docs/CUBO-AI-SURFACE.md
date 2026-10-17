# CuboAI surface — Operate

## Direction contract
THESIS: A familiar, restrained chat surface for understanding CUBO and the signed-in user's recorded summaries. No separate visual identity or neon dashboard.
OWN-WORLD: Inherit CUBO Manrope, green accents, cool dark and light surfaces. Preserve existing navigation and Home spacing.
STORY: Read safety notice, choose whether to suppress it for this account/browser, explicitly load the model, then type or dictate and review a message.
FIRST VIEWPORT: Back and CuboAI left, colored circular percentage right with remaining-week label; spacious message scroll region; obvious anchored composer with mic on its right and send control.
FORM: User-specified chat composition; no concept seed required. Percentage follows the requested green/orange/yellow/red thresholds, with dark text on orange/yellow.
FINISH: Review this ordinary extension against the incumbent components and record evidence and limits here. No new global design system or raster asset is required. Rendered verification remains a separate gate.

No new raster assets or global token changes. Existing visual authority is the app's AppearanceContext, Home and profile surfaces. Notes/history are local only; usage is not enforceable billing. Mic disclosure is independent from safety acknowledgement.

## Implementation evidence and limits

Code inspection of `src/screens/CuboAIScreen.web.tsx`, `src/theme/colors.ts`, `src/theme/theme.ts`, `src/theme/typography.ts`, and the incumbent `AppHeader`, `SurfaceCard`, and `ConfirmSheet` components establishes the following:

- The chat binds its background, card, text, secondary text, border, accent, accent-soft, and on-accent CSS variables to `useAppearance()`. Both appearance palettes remain authoritative; this screen does not redefine them.
- Manrope regular, bold, and extra-bold match the current component implementation. The separate `typography.ts` serif export and `theme.ts` system-font styles do not describe the inspected components, so they should not be treated as evidence of a single consistent global typography specification.
- Rounded surfaces, subdued borders, green actions, Ionicons, and 14px supporting copy follow the incumbent vocabulary. The chat adds a conversation-specific asymmetric user bubble and circular allowance indicator; these are local patterns, not new system-wide rules.
- The web screen uses its own HTML/CSS rather than the React Native component implementations. Its 24px title, 44px circular back control, 14px action radius, and 24px dialog radius differ from `AppHeader` (27px title, 38px rounded-square back control), `ConfirmSheet` (16px action radius, 28px upper sheet corners), and `SurfaceCard` (20px radius). Its centered dialog also differs from the incumbent bottom sheet. These are explicit local variations, not verified pixel parity.
- The error border uses a literal `#BD2929`, while the theme provides danger colors. Dialog scrim and shadow also use local black RGBA values. They are remaining local styling departures; no global token edits were made by this documentation pass.
- Source includes an anchored composer, independently scrolling conversation, safe-area padding, a compact layout rule below 360px, explicit keyboard focus outlines, modal keyboard handling, and 44px microphone/send controls. These implementation details do not establish rendered usability or accessibility compliance.

No screenshot evidence was available because browser capture timed out. Font rendering, small-screen overflow, light/dark contrast in the rendered app, dialog focus behavior, and visual fit beside incumbent screens remain unverified. This record is a code-based comparison, not a visual approval or a complete design-system audit.
