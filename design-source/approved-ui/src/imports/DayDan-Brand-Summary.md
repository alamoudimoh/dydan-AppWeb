# DayDan — Brand Identity Summary for Figma Make

> Condensed from the supplied DayDan brand-identity and color-system HTML references.
> Some source material still uses the legacy name **Taskier**; for this project, treat those identity rules as **DayDan**.

## Brand intent

DayDan is built around **momentum, flow, clarity, and approachable everyday productivity**.

Core identity pair:

- **Momentum Violet** — `#4326EA`
- **Flow Aqua** — `#09CCF4`

The violet carries structure and primary action. Aqua signals movement, active handoff, and flow. Supporting colors should communicate functional states rather than become decorative competing brand colors.

## Core application tokens — Light

| Token | Value | Role |
|---|---:|---|
| Page / Base | `#F8FAFF` | Main application canvas |
| Surface / Panel | `#FFFFFF` | Primary UI surface |
| Soft Violet Surface | `#E9E5FF` | Secondary/card surface |
| Border | `#7A8497` | Dividers and boundaries |
| Primary / Momentum Violet | `#4326EA` | Primary actions, structure, brand |
| Primary Hover / Deep Violet | `#3216C8` | Hover/deeper functional violet |
| Signal / Flow Aqua | `#09CCF4` | Movement, active handoff |
| Readable Deep Aqua | `#006B80` | Aqua-family text on light surfaces |
| Primary Ink | `#0B1020` | Primary text |
| Secondary Ink | `#5E687B` | Secondary/muted text |
| Soft Aqua | `#DDF9FF` | Supporting soft signal surface |

## Core application tokens — Dark

| Token | Value | Role |
|---|---:|---|
| Page | `#080B14` | Dark application canvas |
| Surface | `#0B1220` | Primary dark surface |
| Surface 2 | `#111827` | Lifted surface |
| Primary Text | `#F8FAFC` | Main text |
| Muted Text | `#CBD5E1` | Secondary text |
| Border | `#64748B` | Boundaries |
| Brand | `#C4B5FD` | Accessible violet-family foreground |
| Brand Hover | `#DDD6FE` | Hover / brighter violet |
| Brand Contrast | `#1E1B4B` | Ink on light-violet action surface |
| Aqua / Action | `#7DD3FC` | Accessible aqua-family action/signal |
| Soft Violet | `#1E1B4B` | Soft dark violet surface |

The primary DayDan identity remains Violet × Aqua; accessible tints may be used for interface contrast without redefining the identity.

## Semantic signals

| Meaning | Light-surface value | Dark-surface value |
|---|---:|---:|
| Done / Success | `#0F763F` | `#2DC072` |
| Due / Attention | `#826026` | `#E39B1E` |
| Overdue / Error | `#C52338` | `#F2637A` |
| Flag / Special marker | `#BF1881` | `#EA8AC7` |

Use semantic colors for meaning. Do not use them as competing decorative brand accents.

## Typography

- **Latin / LTR UI:** Ubuntu Sans
- **Arabic / RTL UI:** Cairo
- **Technical data / code:** JetBrains Mono

Arabic is a first-class UI language. The product should support real RTL layout behavior, not only right-aligned text.

## Logo / identity rules

- Momentum Violet carries the main identity.
- Flow Aqua is the secondary identity color.
- Do not recolor the logo into arbitrary palette colors.
- Do not stretch, rotate, distort, or add glow.
- Light and dark application surfaces do **not** create separate logo identities.
- Accessible supporting tints belong to UI content, not to replacement logo colors.

The legacy Taskier wordmark references in the source should be interpreted as identity guidance for DayDan, not as the product name to display.

## Accessibility / contrast principles

- Color must not be the only carrier of meaning.
- Use readable foreground/background pairs.
- Preserve visible focus states.
- Maintain sufficient text and UI-boundary contrast.
- Semantic statuses should use label/icon/shape support in addition to hue.
- Use deeper/readable versions of Aqua or other hues when text contrast requires it.
- Respect high-contrast and reduced-motion users where relevant.

## Design-use guidance

This document defines **brand identity and color behavior**, not screen layout.

For Figma Make:
- Use these tokens and rules as identity constraints.
- Do **not** copy the HTML reference page structure.
- Figma is free to determine navigation, component styling, composition, density, surfaces, hierarchy, and interaction patterns.
- The resulting UI should feel recognizably DayDan without turning every surface violet or aqua.
