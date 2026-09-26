# HeatShield AI — UI/UX Design System Specification (Anti-Slop Edition)

/* Hallmark · pre-emit critique: P5 H5 E5 S5 R5 V5 */
/* Genre: modern-minimal · Theme: Obsidian Emerald (Monochrome + Single Accent) · Macrostructure: Asymmetric Workbench */

## 1. Core Design Philosophy (Strict Anti-AI-Slop Mandate)
- **Strict Single-Color Accent Discipline:** The application chrome uses **ONLY** an achromatic Obsidian/Carbon greyscale hierarchy paired with **ONE** accent color: **Bio-Emerald (`#10B981`)**.
- **Banned AI-Slop Patterns:**
  - ❌ NO multi-color rainbow text gradients (`bg-clip-text` with 3 colors).
  - ❌ NO competing badge colors (red, yellow, blue, orange, purple badges scattered across the page).
  - ❌ NO generic edge-to-edge top sticky navbars with fake "v1.0 MVP" badges.
  - ❌ NO italic emphasis words inside headings. All headings are strictly upright roman.
  - ❌ NO unnested flat cards with harsh borders.
- **Thermal Spectrum Isolation:** Multi-color thermal gradients (Blue → Amber → Crimson) are **strictly isolated** to the Mapbox WebGL canvas data layer and its scientific calibration scale bar. They never bleed into UI buttons, headings, or cards.

## 2. Locked Design Tokens

### Color System (Obsidian + Bio-Emerald)
- `--color-canvas`: `#060809` (Deepest Obsidian Carbon)
- `--color-surface-1`: `#0B0F12` (Primary Panel Core)
- `--color-surface-2`: `#11171B` (Elevated Interactive Surface)
- `--color-bezel-outer`: `rgba(255, 255, 255, 0.025)`
- `--color-border-subtle`: `rgba(255, 255, 255, 0.07)`
- `--color-border-highlight`: `rgba(255, 255, 255, 0.14)`
- `--color-ink-primary`: `#F4F6F7` (Crisp Bone White)
- `--color-ink-secondary`: `#94A3AB` (Technical Silver)
- `--color-ink-muted`: `#5E6E77` (Machined Steel)
- `--color-accent`: `#10B981` (Bio-Emerald Primary)
- `--color-accent-bright`: `#34D399` (Bio-Emerald Hover/Highlight)
- `--color-accent-subtle`: `rgba(16, 185, 129, 0.12)`

### Typography (2-Font Discipline)
- **Display & UI (`--font-display`):** `Plus Jakarta Sans` — geometric precision, upright roman (`font-style: normal`), tight tracking (`tracking-[-0.03em]`).
- **Telemetry & Data (`--font-mono`):** `JetBrains Mono` — `tabular-nums` for coordinates, temperatures, and EPA statistics.

## 3. Structural & Haptic Component Architecture

### A. Double-Bezel ("Doppelrand") Containers
Every major container, bento card, and map frame uses nested physical architecture:
- **Outer Shell:** `p-1.5 rounded-[1.75rem] bg-white/[0.02] border border-white/[0.07]`
- **Inner Core:** `rounded-[calc(1.75rem-6px)] bg-[#0B0F12] border border-white/[0.06] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]`

### B. Floating Island Navigation (N5 Archetype)
- Detached floating pill at the top center (`fixed top-5 inset-x-0 mx-auto w-max z-50`).
- Uses Framer Motion `layoutId` spring indicator for active route transitions.

### C. Button-in-Button CTA Architecture
- Primary CTA is a full pill (`rounded-full bg-emerald-500 text-slate-950 font-semibold pl-6 pr-2 py-2`) containing a nested circular icon housing (`w-8 h-8 rounded-full bg-slate-950/15 flex items-center justify-center`).

## 4. Screen Specifications
1. **Overview (`/`)**: Architectural asymmetric layout with editorial left column, verified EPA/CDC telemetry ledger, and a double-bezel interactive 3D Mapbox workbench on the right, followed by a 3-card asymmetric Bento specification grid.
2. **Live Heat Map (`/map`)**: Full-viewport `100dvh` 3D thermal canvas with floating monochrome obsidian control islands.
3. **Impact Dashboard (`/dashboard`)**: Precision telemetry ledger with double-bezel metric cards and SDG alignment specifications.
