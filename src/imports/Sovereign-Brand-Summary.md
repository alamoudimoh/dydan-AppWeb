# Sovereign — Brand Identity Summary for Figma Make

> Condensed from the supplied Sovereign brand-identity and color-system HTML references.

## Brand intent

Sovereign is a **single, disciplined identity** centered on structural Onyx and meaningful Golden Yellow.

Core identity pair:

- **Onyx** — `#1A1A1A`
- **Golden Yellow** — `#FFC107`

Brand philosophy:

- **Functional Onyx:** deep black carries the structural foundation.
- **Meaningful Gold:** Golden Yellow marks active, focused, and primary states.
- **Single-theme discipline:** Sovereign should feel coherent and controlled rather than decorated with many competing accents.

## Core identity tokens

| Token | Value | Role |
|---|---:|---|
| Base / Onyx | `#1A1A1A` | Core background / structural identity |
| Panel | `#242424` | Sidebar, headers, elevated dark surfaces |
| Card | `#2E2E2E` | Component surfaces |
| Border | `#4D4D4D` | Dividers and boundaries |
| Accent / Golden Yellow | `#FFC107` | Primary accent, focus, actions |
| Accent High | `#FFD04D` | Hover / brighter accent |
| Accent Low | `#CC9900` | Pressed / deeper accent |
| Primary Ink | `#F2F2F2` | Primary text on dark surfaces |
| Secondary Ink | `#999999` | Secondary/body text |
| Tertiary Ink | `#666666` | Muted/tertiary token |

## Light application surface

| Token | Value |
|---|---:|
| Page | `#FFFFFF` |
| Surface | `#F2F2F2` |
| Surface 2 | `#FFFFFF` |
| Text | `#1A1A1A` |
| Muted | `#4D4D4D` |
| Border | `#666666` |
| Primary Brand | `#1A1A1A` |
| Action | `#FFC107` |
| Action Text | `#1A1A1A` |

Golden Yellow is **not** body text on white. Use Onyx on gold, not gold on white.

## Dark / native Sovereign surface

| Token | Value |
|---|---:|
| Page | `#1A1A1A` |
| Surface | `#242424` |
| Surface 2 | `#2E2E2E` |
| Text | `#F2F2F2` |
| Muted | `#999999` |
| Border | `#999999` |
| Brand / Action | `#FFC107` |
| Brand Hover | `#FFD04D` |
| Brand Contrast | `#1A1A1A` |

## Semantic / supporting Signal colors

Golden Yellow is the brand accent, **not a complete semantic vocabulary**.

| Signal family | Light-surface value | Onyx-surface value |
|---|---:|---:|
| Teal | `#21787B` | `#31BFC4` |
| Azure | `#306EB5` | `#559AEA` |
| Verdant | `#1A7C48` | `#31C476` |
| Crimson | `#C73549` | `#E87382` |
| Violet | `#7B43C4` | `#AC85E0` |

Use these for semantic differentiation such as links, success, failure, charts, or other meaningful signals as appropriate. Do not recolor the Sovereign logo into these hues.

## Golden Yellow standing rule

Golden Yellow is appropriate as:
- a surface
- a fill
- a primary action
- a focus/active signal shape

It should **not** be:
- body text on white
- a normal hyperlink on white
- the only signal for success/failure
- an arbitrary decorative foreground

## Typography

- **Latin / LTR UI:** Ubuntu
- **Arabic / RTL UI:** Cairo
- **Technical data / code:** Ubuntu Mono

Arabic should be supported as a real RTL interface.

## Logo rules

- Preserve the supplied **Onyx + Golden Yellow** artwork.
- Do not recolor it into Signal hues.
- Do not rotate, distort, stretch, glow, or substitute a foreign palette.
- The identity relationship remains fixed across light and dark application surfaces.
- On dark surfaces, use enough surface separation so the Onyx form remains readable.
- Supporting Signal colors belong to interface content, not to alternate logo identities.

## Accessibility / contrast principles

- Preserve text and UI-boundary contrast.
- Do not rely on color alone.
- Maintain visible focus states.
- Use semantic supporting hues where gold cannot communicate meaning.
- On light backgrounds, pair Golden Yellow with Onyx text rather than using gold as text.
- Use icons, labels, shapes, and boundaries in addition to hue for status differentiation.
- Respect high-contrast and reduced-motion preferences where relevant.

## Design-use guidance

This document defines **Sovereign identity**, not a predefined UI layout.

For Figma Make:
- Use these colors, typography rules, logo principles, and contrast rules as constraints.
- Do **not** copy the supplied HTML page structure.
- Sovereign should not be a DayDan layout merely recolored black and yellow.
- It may have its own visual expression, surfaces, emphasis, and component treatment while preserving the same DayDan product architecture and functionality.
