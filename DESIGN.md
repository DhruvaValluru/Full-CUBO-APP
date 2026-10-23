---
name: CUBO
description: A calm driving cockpit with a charcoal cabin, restrained green signals, a live map, and clear actions.
colors:
  signal-green: "#087D52"
  signal-green-dark: "#63CF93"
  charcoal-cabin: "#101315"
  charcoal-surface: "#191D1F"
  cockpit-top: "#0B3023"
  cockpit-middle: "#0E4A2D"
  cockpit-bottom: "#072B1C"
  score-light: "#AEFF8B"
  score-middle: "#53DD63"
  score-deep: "#168441"
  mineral-road: "#F7F8F6"
  mineral-surface: "#FFFFFF"
  mineral-muted: "#F0F3F0"
  graphite-ink: "#102019"
  quiet-ink: "#53635A"
  forest-ink: "#F4F8F7"
  forest-quiet-ink: "#B8CDC3"
  signal-wash: "rgba(8, 125, 82, 0.10)"
  mineral-border: "rgba(13, 61, 41, 0.10)"
  mineral-border-strong: "rgba(13, 76, 49, 0.19)"
  welcome-sage-start: "#4C6949"
  welcome-sage-end: "#82A87C"
  danger: "#FF453A"
  caution-light: "#A66D12"
  caution-dark: "#FFB020"
typography:
  display:
    fontFamily: "Manrope, system-ui, sans-serif"
    fontSize: "68px"
    fontWeight: 800
    lineHeight: "78px"
    letterSpacing: "-3px"
  wordmark:
    fontFamily: "Manrope, system-ui, sans-serif"
    fontSize: "42px"
    fontWeight: 700
    letterSpacing: "4.2px"
  headline:
    fontFamily: "Manrope, system-ui, sans-serif"
    fontSize: "29px"
    fontWeight: 800
    lineHeight: "36px"
    letterSpacing: "-0.7px"
  readiness:
    fontFamily: "Manrope, system-ui, sans-serif"
    fontSize: "22px"
    fontWeight: 700
    letterSpacing: "-0.6px"
  destination:
    fontFamily: "Manrope, system-ui, sans-serif"
    fontSize: "17px"
    fontWeight: 600
  title:
    fontFamily: "Manrope, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 800
  body:
    fontFamily: "system-ui, sans-serif"
    fontSize: "11px"
    lineHeight: "16px"
  label:
    fontFamily: "Manrope, system-ui, sans-serif"
    fontSize: "10px"
    fontWeight: 600
rounded:
  sm: "10px"
  welcome: "13px"
  md: "14px"
  action: "16px"
  lg: "18px"
  xl: "22px"
  navigation: "26px"
  xxl: "28px"
  pill: "999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "20px"
  xl: "24px"
  xxl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.signal-green}"
    textColor: "{colors.mineral-surface}"
    rounded: "{rounded.md}"
    height: "48px"
  button-welcome:
    textColor: "{colors.mineral-surface}"
    rounded: "{rounded.welcome}"
    height: "52px"
  button-welcome-outline:
    backgroundColor: "rgba(8,13,16,.35)"
    textColor: "{colors.mineral-surface}"
    rounded: "{rounded.welcome}"
    height: "52px"
  input-destination:
    backgroundColor: "{colors.mineral-muted}"
    textColor: "{colors.graphite-ink}"
    typography: "{typography.destination}"
    rounded: "{rounded.action}"
    padding: "0px 12px"
    height: "58px"
  card-calibration:
    backgroundColor: "{colors.mineral-surface}"
    textColor: "{colors.graphite-ink}"
    rounded: "{rounded.xl}"
    padding: "14px"
    height: "76px"
  chip-ready:
    backgroundColor: "{colors.signal-green}"
    textColor: "{colors.mineral-surface}"
    rounded: "{rounded.sm}"
    padding: "0px 9px"
    height: "28px"
  navigation-floating:
    backgroundColor: "{colors.mineral-surface}"
    textColor: "{colors.quiet-ink}"
    typography: "{typography.label}"
    rounded: "{rounded.navigation}"
    padding: "6px 7px"
    height: "72px"
  safety-field:
    textColor: "{colors.mineral-surface}"
    padding: "22px 24px 54px"
    height: "438px"
  assistant-action:
    backgroundColor: "{colors.signal-wash}"
    textColor: "{colors.graphite-ink}"
    rounded: "{rounded.action}"
    padding: "16px"
    height: "76px"
---

# Design System: CUBO

## Overview

**Creative North Star: "The Calm Cockpit"**

CUBO treats each screen like a composed vehicle cabin: the state a driver needs now is dominant, while supporting controls remain calm, predictable, and close to the hand. A broad forest field gives safety readiness its own space; the live map gives destination selection its own canvas. Strong hierarchy, real account data, and explicit actions define the experience.

The visual system pairs mineral light surfaces with neutral charcoal dark surfaces, a luminous score ring, and quiet typography. Photography is concentrated in the dusk welcome scene. Home uses a charcoal cockpit in dark appearance and the established forest field in light appearance; controls beneath it follow the selected theme. The approved compositions in `.impeccable/mocks/approved/` and `docs/mockup-fidelity-2026-10-22.md` govern these surfaces. The mockups' names, addresses, scores, and map contents are examples, not product data.

**Key Characteristics:**

- A full-width cockpit field with horizontally paged safety-score and potential-savings rings.
- Mineral light surfaces, charcoal dark surfaces, and clear semantic green accents.
- A destination action across Home's boundary and one unified idle Map sheet.
- Five floating destinations: Home, Map, Activity, Garage, Account.
- Real photographic atmosphere with semantic text and actions.
- One-shot entrance motion and reduced-motion-aware press feedback.

This is a source-derived refresh of the existing guide, not a visual acceptance or release certificate. The Impeccable launcher failed with `cache_directory_failed`; no automated Impeccable phase gates are claimed.

## Colors

The palette separates deep forest atmosphere, bright score-ring emphasis, quiet mineral controls, and semantic state.

### Primary

- **Signal Green** (`signal-green` / `signal-green-dark`): theme-aware actions, selected tabs, and meaningful state.
- **Cockpit Forest** (`cockpit-top`, `cockpit-middle`, `cockpit-bottom`): Home's full-width gradient; the top tone also connects its safe area and Account header.
- **Score Light** (`score-light`, `score-middle`, `score-deep`): the Home ring's vertical gradient. This concentrated luminous treatment is part of the approved composition.

### Secondary

- **Welcome Sage** (`welcome-sage-start` / `welcome-sage-end`): the Sign in gradient over dusk photography.
- **Semantic Signals** (`danger`, `caution-light`, `caution-dark`): destructive actions and alert or hazard states, with the appearance-specific caution value.

### Neutral

- **Mineral Road / Surface / Muted**: light page field, white containers, and quiet search-field fill.
- **Graphite / Quiet Ink**: primary and supporting light-mode content.
- **Charcoal Cabin / Surface**: dark page field and cards; light neutral ink carries their text.
- **Mineral Border / Strong Border**: low-contrast boundaries; **Signal Wash** supports assistant and state surfaces.

**The Forest and Signal Rule.** Forest may fill the dominant header; the bright ring is reserved for the score, and ordinary controls use the theme accent.

## Typography

Manrope weights 400, 500, 600, 700, and 800 are loaded in `App.tsx`. Explicit Manrope roles coexist with system text in supporting rows; `theme.ts` does not globally apply Manrope. The frontmatter records actual roles, not a fabricated universal type scale.

The score uses the display role with tabular numerals. Home's first name uses headline; its readiness statement uses readiness. The welcome wordmark is all-white bold Manrope with deliberate tracking, while its tagline reads “Personal Drive Assistant.” Account's title is extra-bold Manrope (32px). Destination input is semibold; Home's matching destination action is bold at the same size. Calibration titles and their supporting copy supply the title and body roles. Navigation labels use the label role, rising to weight 800 when selected.

**The Glance Rule.** The important number or action reads before supporting copy; labels remain subordinate to the primary state.

## Layout

Portrait mobile is primary. Shared spacing comes from `src/theme/theme.ts`; the shell normally uses 20px horizontal padding and 125px bottom scroll clearance. Home and Account opt into edge-to-edge headers and 22px body gutters.

Home's cockpit field has a 438px minimum height and no enclosing small-card silhouette. Its horizontally paged rings occupy 252px squares: the first opens Activity, and the clearly labeled illustrative savings preview opens Insurance. A 68px-high destination action overlaps the field's lower boundary by 32px. Saved Home and Work destinations sit immediately below it, before Assistant and three readiness controls. Home does not force the leading region to fill a viewport, so no artificial blank area separates readiness from Your Garage.

Map is full-bleed. Its idle destination sheet uses 12px outer gutters, 28px corners, and 18px internal horizontal padding. Search, saved places, real recent destinations, permission messages, route preview, and Start drive share that sheet. On the Map tab the overlay reserves 100px below it for navigation. The idle sheet is scrollable and capped at `max(100, height - topInset - bottomInset - bottomReserve - 190)`, where bottomReserve is 100 on the Map tab and 12 on the separate DriveMap screen. Below 680px measured height, Notifications, Account, Assistant, and Locate form one four-button utility row. Taller layouts place Assistant and Locate above the measured sheet height. These adaptations concern idle Map; active-drive controls retain their existing behavior.

The idle Map sheet has two deliberate detents. Its compact detent leaves the destination field visible at 96px; its expanded detent reveals saved places, recent destinations, and route actions. Tapping or focusing the destination field expands it. The grabber is both tappable and vertically draggable, and the transition respects reduced-motion preferences.

Welcome fills the viewport with the dusk background plate using cover sizing. Identity starts at 21% from the top; actions sit 8% from the bottom with 8% side gutters. Account extends the forest-header/mineral-body relationship and uses grouped settings rows.

The rest of the product follows the same system rather than reverting to the previous card grid. Activity uses one dominant score field followed by compact metrics and a timeline-like trip list. Garage makes the selected vehicle the focal object in a charcoal stage, then uses a restrained inventory list. Family/Friends leads with relationship and permission status before code or management controls. Address search and settings-detail screens use a single focused work surface and flat grouped rows. Home keeps one Your Garage stage and one connection stage below the cockpit; Drive Services remains on its dedicated screens rather than repeating on Home.

Web uses full-screen layout below 600px viewport width, or on a coarse-pointer phone whose shorter physical screen dimension is below 600px. Wider desktop views use the existing 340 × 780 preview shell, capped at 90vh. These are distinct width and height conditions, not interchangeable breakpoints. Preserve child ancestry across resizing so account and drive state are not remounted.

## Elevation & Depth

Tonal fields and hairline borders provide most separation. Floating navigation, destination controls, sheets, and the desktop preview add ambient shadows. Home's atmosphere comes from its forest gradient and translucent radial field, while its score uses layered SVG strokes; it does not rely on a rounded hero card.

The sidecar retains exact React Native shadow definitions for the shared card and phone frame plus the current map sheet and floating navigation. CSS preview shadows are translations for the documentation panel, not a claim of identical native rasterization.

**The Float With Purpose Rule.** A shadow signals a surface that overlays or controls the page; ordinary rows use tone and spacing.

## Shapes

The shared corner scale remains intact. Current welcome actions add 13px corners; Home destination and Assistant actions use 16px; navigation uses 26px; the idle Map sheet uses 28px. Avatars, score orbits, and map utilities are circular. The broad Home and Account headers meet the screen edge directly. Do not substitute a small rounded card for that full-width field.

## Components

### Buttons

Map's enabled Start drive is a 48px minimum-height accent action with 14px corners. Welcome's two actions are 52px minimum-height controls: sage-gradient Sign in and translucent outlined Create account. Their text is live Manrope (600, 17px); their handlers select login and signup. Other existing flows retain their own established sizing.

`MotionPressable` defaults to scale 0.97 over 100ms and opacity 0.92. Release restores opacity over 180ms and scale via the existing clamped spring (damping 20, stiffness 320, mass 0.55). Individual controls override scale. Reduced motion keeps scale at 1. Native/web focus behavior is control-specific; preserve visible keyboard focus rather than assuming every control already has a custom ring.

### Chips

The existing READY badge is a compact calibration status, with accent fill, 28px minimum height, 10px corners, and extra-bold 8px uppercase text tracked by 1px. It describes saved calibration, not proof that the camera is actively monitoring.

### Cards / Containers

Supporting calibration rows use a 76px minimum height, 22px corners, a subtle strong boundary, and 14px padding. Assistant uses a 76px minimum-height accent-wash action with 16px corners and 16px padding. Account groups use compact dividers. Preserve the hierarchy between broad headers, primary actions, and supporting rows.

Avoid nested cards and repeated soft-corner tiles. A screen gets at most one dominant visual field; secondary information is usually a divided row, a timeline item, or a compact chip. White or forest surfaces should communicate hierarchy, not decorate every data point.

### Inputs / Fields

The Map destination field lives inside a 58px minimum-height muted row with 16px corners. Input text can shrink within the row; trailing search, clear, and keyboard controls retain 44px hit areas. Search disables at opacity 0.35 while unavailable. Account editor fields remain 52px minimum-height white/forest controls with 14px corners and theme borders. Permission and search errors remain readable text.

### Navigation

Five equal destinations appear in this order: Home, Map, Activity, Garage, Account. The bar has 14px side offsets, 72px minimum height, 26px corners, and 54px minimum-height items. Its bottom offset is the greater of the safe inset and 12px. Selection changes icon fill, accent color, and label weight; both item and icon-shell backgrounds remain transparent in the current implementation. An active drive hides the bar.

### Safety and Savings Carousel

The first ring displays the average score from attention-measured drives, or 100 with the Starter safety score label when no measured drives exist. Its stroke reflects the clamped 0–100 score. The second ring is explicitly labeled as an illustrative potential premium saving and links to Insurance; it is not presented as money already earned. Greeting, avatar, unread notification count, and active-drive status use live state. Camera readiness reflects stored calibration; Location says On demand; Blocked Apps says Configured or Optional. Preserve those distinctions.

### Welcome and Account

The welcome image is `assets/welcome/cubo-dusk.webp` (832 × 1890, 47,770 bytes), a background-only derivative of the approved image. Text, wordmark, and buttons remain semantic UI. Asset provenance lives in the fidelity contract. Account uses the same forest top tone with its own gradient endpoint, real profile data, and themed settings below.

### Motion

`Reveal` runs once with opacity and 12px upward settling over 420ms, using cubic-out easing; reduced motion sets duration and travel to zero. Home's ring and welcome identity/actions use it. Do not infer a performance benchmark or a repository-wide animation audit from this helper.

Motion explains state changes: the Map sheet changes detent, buttons provide brief press feedback, and content settles in once. Avoid looping decoration, layout-jarring entrances, and long transitions. Reduced motion must preserve every state change without spatial travel.

## Do's and Don'ts

### Do:

- **Do** preserve the approved full-width forest Home field, score ring, boundary-crossing destination action, and five-tab hierarchy.
- **Do** keep Map's idle search, places, route preview, and Start drive together in one scrollable sheet.
- **Do** use real account, permission, route, and drive state for all operational copy.
- **Do** maintain light and dark appearance, visible focus, and the product requirement of at least 44px touch targets.
- **Do** honor reduced motion and keep primary actions semantic and reachable.

### Don't:

- **Don't** flatten the approved compositions into palette-only changes or equal-weight cards.
- **Don't** turn the score ring's luminous treatment into a universal neon accent.
- **Don't** bake text or controls into the welcome photograph or seed mockup identities and addresses.
- **Don't** equate saved calibration with active camera access or configured app blocking with enforced blocking.
- **Don't** imply safety guarantees, traffic knowledge, or backend abilities the live product does not supply.
