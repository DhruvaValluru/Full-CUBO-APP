---
name: CUBO
description: A calm, map-aware safety interface composed like a modern vehicle cabin.
colors:
  signal-green: "#087D52"
  signal-green-dark: "#63CF93"
  forest-cabin: "#07130E"
  forest-surface: "#0F2119"
  mineral-road: "#F1F4F0"
  mineral-surface: "#FBFCFA"
  graphite-ink: "#102019"
  quiet-ink: "#53635A"
  danger: "#FF453A"
  caution: "#FFB020"
typography:
  display:
    fontFamily: "Manrope, system-ui, sans-serif"
    fontSize: "42px"
    fontWeight: 800
    lineHeight: 1.05
    letterSpacing: "-1.4px"
  headline:
    fontFamily: "Manrope, system-ui, sans-serif"
    fontSize: "25px"
    fontWeight: 800
    lineHeight: 1.12
  body:
    fontFamily: "Manrope, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 500
    lineHeight: 1.5
  label:
    fontFamily: "Manrope, system-ui, sans-serif"
    fontSize: "11px"
    fontWeight: 700
    lineHeight: 1.2
rounded:
  sm: "10px"
  md: "14px"
  lg: "18px"
  xl: "22px"
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
    textColor: "#FFFFFF"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: "16px 20px"
    height: "54px"
  card-surface:
    backgroundColor: "{colors.mineral-surface}"
    textColor: "{colors.graphite-ink}"
    rounded: "{rounded.xl}"
    padding: "20px"
  input-standard:
    backgroundColor: "{colors.mineral-surface}"
    textColor: "{colors.graphite-ink}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: "12px 14px"
    height: "52px"
---

# Design System: CUBO

## Overview

**Creative North Star: "The Calm Cockpit"**

CUBO treats each screen like a composed vehicle cabin: the one state a driver needs now is dominant, while secondary controls remain calm, predictable, and close to the hand. The interface uses confident hierarchy instead of repeated equal-weight cards. Maps, safety readiness, and explicit actions do the visual work.

The system is premium through restraint rather than ornament. Green is a signal, not wallpaper; depth is ambient; motion explains state changes; imagery appears only when it supplies real context. Light mode is cool mineral rather than cream, and dark mode is green-black rather than blue-black.

**Key Characteristics:**

- One dominant state or action per viewport.
- Cool mineral light surfaces and deep forest dark surfaces.
- Restrained signal green, semantic red/orange, and quiet graphite text.
- Compact floating navigation and bottom-sheet map controls.
- Purposeful, reduced-motion-aware feedback.

## Colors

The palette pairs road-like mineral neutrals with a forest cabin and one restrained CUBO signal green.

### Primary

- **Signal Green** (`signal-green` / `signal-green-dark`): primary actions, selected navigation, active monitoring, and confirmed safety state.

### Secondary

- **Forest Cabin** (`forest-cabin` / `forest-surface`): dark-mode ground and raised surfaces.
- **Semantic Signals** (`danger` / `caution`): destructive states, destination or alert urgency, and community hazards.

### Neutral

- **Mineral Road** (`mineral-road`): light-mode page field.
- **Mineral Surface** (`mineral-surface`): elevated light-mode controls and sheets.
- **Graphite Ink** (`graphite-ink`): primary light-mode text.
- **Quiet Ink** (`quiet-ink`): supporting copy and inactive navigation.

### Named Rules

**The Signal, Not Paint Rule.** Green identifies action, selection, readiness, or monitoring; it does not fill every container.

**The Semantic Marker Rule.** Police/community warnings are orange, route/destination urgency is red, the driver is blue or green, and routes remain CUBO green.

## Typography

**Display Font:** Manrope (with system sans-serif fallback)  
**Body Font:** Manrope (with system sans-serif fallback)

**Character:** Wide-open, geometric, and legible at a glance. Weight and size carry hierarchy; decorative letter treatments do not.

### Hierarchy

- **Display** (800, 42px, 1.05): authentication and welcome statements.
- **Headline** (800, 25px, 1.12): screen identity and important scores.
- **Title** (700, 18px): major sections and sheet headers.
- **Body** (500, 14px, 1.5): explanations, statuses, and forms.
- **Label** (700, 9–11px): compact state labels; uppercase is reserved for short operational labels.

### Named Rules

**The Glance Rule.** The important number or action must read before supporting copy; labels never compete with the primary state.

## Layout

Portrait mobile is primary. Screen content uses a compact 4/8/12/20/24/32 spacing rhythm with at least 44px interactive targets. Desktop web centers the same mobile product inside a device preview rather than inventing a second dashboard. Home begins with a dominant safety field; Map is full-bleed and concentrates entry and drive controls near the bottom. The floating tab bar uses four equal destinations and clears the screen during an active drive.

Responsive containers must include padding inside their declared width (`border-box` on web) so narrow iPhone-class viewports never clip controls. Reduced motion preserves state changes without spring travel.

## Elevation & Depth

Depth is a hybrid of tonal layering, hairline borders, and soft ambient shadows. Flat content stays flat; only floating navigation, major hero surfaces, bottom sheets, and the desktop phone frame lift from the ground.

### Shadow Vocabulary

- **Ambient Card** (`0 10px 22px rgba(0,0,0,0.16)`): dominant cards and bottom sheets.
- **Phone Frame** (`0 18px 32px rgba(0,0,0,0.45)`): desktop preview shell only.

### Named Rules

**The Float With Purpose Rule.** A shadow signals a surface that moves, overlays, or controls the page; ordinary rows use tone and spacing instead.

## Shapes

The system uses a controlled family from 10px to 28px. Inputs and compact actions sit at 10–14px; cards at 18–22px; immersive hero and modal surfaces at 28px. Circles are reserved for avatars, map markers, and icon-only controls. Avoid nesting several rounded rectangles when spacing or a divider communicates the relationship.

## Components

### Buttons

- **Shape:** confident rounded rectangle (14px) with a minimum 54px primary height.
- **Primary:** Signal Green with white/on-accent text and a clear verb.
- **Hover / Focus:** small opacity or scale feedback plus a visible green focus outline on web.
- **Secondary / Ghost:** mineral or forest surface with a hairline border; no decorative gradient.

### Cards / Containers

- **Corner Style:** 18–22px for ordinary surfaces; 28px for one dominant hero.
- **Background:** tonal surface that contrasts with the page field.
- **Shadow Strategy:** ambient shadow only for elevated, interactive, or overlay surfaces.
- **Border:** low-contrast one-pixel/hairline boundary.
- **Internal Padding:** 12–24px according to density.

### Inputs / Fields

- **Style:** 52px minimum height, 14px radius, quiet surface, one-pixel boundary.
- **Focus:** CUBO green boundary without changing the field's size.
- **Error / Disabled:** semantic copy or reduced opacity; never color alone.

### Navigation

The floating tab bar is a compact elevated surface. The active destination gets a quiet green wash and a separate icon shell; inactive items use secondary ink. Drive mode removes the bar so navigation cannot compete with safety controls.

### Safety Field

Home's signature surface combines the real score, a single readiness statement, and three compact operational facts. It uses a deep forest gradient and a restrained green glow whose role is atmosphere, not decoration.

## Do's and Don'ts

### Do:

- **Do** make the map, safety score, or immediate action dominate each screen.
- **Do** use Signal Green sparingly for meaningful state and interaction.
- **Do** preserve at least 44px touch targets and readable contrast in both modes.
- **Do** keep motion interruptible and honor reduced-motion settings.

### Don't:

- **Don't** turn every section into an equal soft card.
- **Don't** use neon green, blue-black default dark mode, gradient text, or decorative glass effects.
- **Don't** copy Tesla, Mobbin, Klarna, Bump, or another product's branding or signature assets.
- **Don't** let visual polish imply safety guarantees, traffic data, or backend abilities CUBO does not have.
