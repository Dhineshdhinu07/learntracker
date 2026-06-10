# LearnTrack — Design System

> A single dark canvas. Every surface, type scale, and motion decision in one place.

---

## Philosophy

Pure black canvas. White accent. Rich motion. The visual language is inspired by:

| Source | What we borrow |
|---|---|
| **Vercel** | `#000` canvas · white primary CTA · rect buttons · near-zero chrome |
| **Notion** | Card structure · density-aware spacing · quiet hierarchy |
| **Linear** | Surface ladder · hairline borders · sidebar nav · eyebrow labels |

**Core rules:**
- Dark-only — `#000000` is the canvas, no light mode exists
- Monochrome palette — white is the only accent; semantic colours (green/amber/red) are the only exceptions
- Category colours are kept solely for visual differentiation in charts and dot indicators
- Motion is generous but never distracting — every state change transitions

---

## Color Tokens

All tokens are CSS custom properties on `:root`. Reference them as `var(--token-name)`.

### Surface Ladder

```
--canvas      #09090e   Page background — the deepest layer
--surface-1   #0d0e14   Cards, panels, sidebar
--surface-2   #13141b   Hover states, featured rows
--surface-3   #1a1b23   Interactive backgrounds, code blocks
--surface-4   #21222b   Popovers, dropdowns, tooltips
```

Use the ladder like depth: elements higher in the visual hierarchy sit on a lighter surface. Never skip steps (e.g. don't put a `--surface-4` element directly on `--canvas`).

### Ink Scale

```
--ink     #eeeef2   Headings, primary labels — near-white
--ink-2   #b4b5c4   Body text, secondary labels
--ink-3   #7c7d8e   Muted / tertiary — timestamps, captions
--ink-4   #4e4f5e   Disabled, very subtle — divider labels, placeholders
```

### Accent (Indigo)

```
--accent        #6366f1   Primary CTA, active nav, focus rings
--accent-light  #818cf8   Coach labels, sparkle icons, list bullets
--accent-press  #4f46e5   Button :active state
--accent-bg     rgba(99,102,241, 0.10)   Active nav background
--accent-glow   rgba(99,102,241, 0.20)   Focus ring box-shadow
```

### Hairlines

```
--line        rgba(255,255,255, 0.07)   Default borders — card edges, dividers
--line-strong rgba(255,255,255, 0.12)   Inputs, focused elements
--line-focus  rgba(99,102,241,  0.50)   Focused input border
```

### Semantic

```
--green   #22c55e   Streak alive, readiness strong, due dates future
--amber   #f59e0b   Warnings, "moderate" readiness, overdue soon
--red     #ef4444   Errors, overdue, destructive actions
```

### Category Tints (Notion-style)

Applied as background on chip/pill elements. Each tint is a low-opacity fill so text color can stay `--ink-2`.

```
--tint-dsa   rgba(99,102,241,  0.12)   DSA         indigo
--tint-java  rgba(245,158,11,  0.12)   Python      amber
--tint-sd    rgba(16,185,129,  0.12)   System Design  emerald
--tint-ai    rgba(139,92,246,  0.12)   Computer Fundamentals  violet
--tint-other rgba(107,114,128, 0.10)   Other       grey
```

Full category colour map (dot indicators, focus area list):

| Category | Hex | Role |
|---|---|---|
| DSA | `#6366f1` | Indigo — primary focus |
| Python | `#0ea5e9` | Sky blue |
| System Design | `#10b981` | Emerald |
| Computer Fundamentals | `#f59e0b` | Amber |
| Frontend | `#ec4899` | Pink |
| Backend | `#8b5cf6` | Violet |
| Other | `#6b7280` | Grey |

---

## Typography

**Font:** Inter (variable, weights 100–900 in one file). Loaded via `next/font/google` with `display: swap`. Applied as `--font-sans`.

Global: `font-size: 14px`, `font-weight: 400`, `line-height: 1.5`, `font-feature-settings: "ss01"` (single-story 'a').

### Scale

| Class | Size | Weight | Tracking | Usage |
|---|---|---|---|---|
| `.display-num` | 40px | 300 | −0.04em | Hero stats, large callout numbers |
| `.stat-num` | 28px | 300 | −0.04em | Card metric numbers |
| `.title-page` | 22px | 600 | −0.03em | Page `<h1>` |
| `.title-card` | 15px | 600 | −0.02em | Card / section headings |
| `.body-sm` | 13px | 400 | — | Default body copy |
| `.caption` | 12px | 400 | — | Timestamps, helper text |
| `.eyebrow` | 11px | 600 | +0.06em | All-caps section labels |
| `.mono` | 12px | 400 | −0.01em | Code, IDs, time values |
| `.num` | (inherit) | — | — | Adds `tabular-nums` to any element |

The Stripe principle: **thin numbers feel editorial**. Use weight 300 for any displayed metric (hours, streak, score). Use weight 600 only for labels and headings.

### Gradient Text

```css
.gradient-text {
  background: linear-gradient(135deg, #818cf8 0%, #a78bfa 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}
```

Use sparingly — page heroes, empty-state headlines only.

---

## Card System

### `.card`
The base layer. Use for all content containers.

```css
background: var(--surface-1);
border: 1px solid var(--line);
border-radius: 12px;
```

### `.card-interactive`
Same as `.card` but gains hover feedback. Use for clickable list rows, selectable items.

```css
/* adds: */
transition: background 150ms, border-color 150ms;
cursor: default;
/* :hover → surface-2, line-strong */
```

### `.hero-mesh`
Layered radial gradients (indigo + violet + emerald) rendered as a `::before` pseudo-element. Use on stat callout cards where you want ambient colour depth. Applied with `position: relative; overflow: hidden`.

---

## Button System

### `.btn-primary` — Stripe pill
```css
background: #6366f1;
border-radius: 9999px;
padding: 9px 18px;
font-size: 14px; font-weight: 500;
/* hover → #818cf8  |  active → #4f46e5 + scale(0.98)  |  disabled → opacity 0.45 */
```

### `.btn-secondary` — Linear ghost
```css
background: transparent;
border: 1px solid var(--line-strong);
border-radius: 8px;
padding: 7px 14px;
font-size: 13px; font-weight: 500;
/* hover → surface-2, ink, line-strong */
```

### `.btn-icon` — icon-only ghost
```css
background: transparent;
border: 1px solid var(--line);
border-radius: 8px;
padding: 6px;
/* hover → surface-2, ink */
```

---

## Form Inputs

All inputs (`text`, `number`, `date`, `time`, `select`, `textarea`) share:

```css
background: var(--surface-2);
border: 1px solid var(--line-strong);
border-radius: 8px;
padding: 9px 12px;
font-size: 14px;
color: var(--ink);
/* focus → border: #6366f1, box-shadow: 0 0 0 3px var(--accent-glow) */
```

`label` elements are always eyebrow-style: 11px, 600 weight, `--ink-3`, uppercase, 6px bottom margin.

---

## Navigation

### Mobile — Bottom tab bar
Fixed to the bottom of the viewport. 5 items: Today · Focus · Log · Stats · Coach.

```
height: 60px
background: rgba(9,9,14, 0.92) + backdrop-blur: 24px
border-top: 1px solid var(--line)
padding-bottom: env(safe-area-inset-bottom)
```

Active item: icon `strokeWidth 2.2`, label `fontWeight 700`, colour `#818cf8`.  
Active indicator: 20×3px indigo pill, `border-radius: 9999px`, centred above the icon.

Hidden on the `/focus` route (full-screen timer overlay takes over).

### Desktop — Left sidebar
Fixed, 240px wide. Always visible on `md+` breakpoints. Body gets `padding-left: 240px`.

```
background: var(--surface-1)
border-right: 1px solid var(--line)
```

Active nav item:
```css
background: rgba(99,102,241, 0.12);
border: 1px solid rgba(99,102,241, 0.18);
color: #818cf8;
/* + 6px indigo dot on the right */
```

Sidebar footer: focus area legend — each category as a 6px colour dot + 12px label.

---

## Chip / Badge

```css
.chip {
  display: inline-flex; align-items: center; gap: 4px;
  padding: 3px 8px;
  border-radius: 6px;
  font-size: 12px; font-weight: 600;
  border: 1px solid transparent;
}
```

Pair with a tint variable for background and the matching colour for text + border. Example:

```jsx
<span className="chip" style={{
  background: 'var(--tint-dsa)',
  color: '#818cf8',
  borderColor: 'rgba(99,102,241,0.2)',
}}>DSA</span>
```

---

## Animations

### `.animate-in` — entry fade-up
```css
animation: fadeUp 0.18s ease-out;

@keyframes fadeUp {
  from { opacity: 0; transform: translateY(5px); }
  to   { opacity: 1; transform: translateY(0); }
}
```

Apply to any element that appears dynamically: cards, messages, modals, list items.

### Bounce — typing indicator dots
```css
@keyframes bounce {
  0%, 80%, 100% { transform: translateY(0);    opacity: 0.4; }
  40%           { transform: translateY(-5px); opacity: 1;   }
}
```

Three dots, each delayed by `0.2s * index`. Used in the AI Coach "Thinking…" indicator.

### Transition defaults
- **Background / colour changes:** `150ms ease`
- **Interactive feedback (border, bg):** `120ms ease`
- **Progress bars:** `400ms ease` (width)
- **Readiness bars:** `600ms ease` (width — longer for dramatic reveal)
- **Chevron rotate:** `200ms ease`
- **Button press scale:** `100ms`

---

## Progress Bar

```css
.progress-track {
  height: 4px;
  background: var(--surface-3);
  border-radius: 9999px;
  overflow: hidden;
}
.progress-fill {
  height: 100%;
  border-radius: 9999px;
  transition: width 400ms ease;
}
```

Fill colour is always semantic: `--green` / `--amber` / `--red` based on the value being shown.

---

## Pomodoro Timer (Focus page)

Full-screen overlay: `position: fixed; inset: 0; z-index: 9999`.

**SVG ring:**
- `cx=110, cy=110, r=90` — viewBox `0 0 220 220`
- Circumference ≈ `565.5px`
- `strokeDashoffset = CIRC * progress` where `progress` depletes from 1→0
- `transform: rotate(-90deg)` on the SVG to start at 12 o'clock
- Track: `stroke: rgba(255,255,255,0.06)`
- Fill: `stroke: #6366f1` with `filter: drop-shadow(0 0 8px rgba(99,102,241,0.6))`

**Ambient glow:** `radial-gradient(ellipse 60% 60% at 50% 45%, rgba(99,102,241,0.12), transparent)` centred behind the ring.

**Landscape detection:** `window.innerHeight < 540` — layout switches from column to row (ring left, controls right).

---

## Markdown Renderer (`MarkdownMessage`)

Custom zero-dependency renderer used in AI Coach chat bubbles and report cards.

| Markdown | Rendered as |
|---|---|
| `# H1` | 15px, weight 700, `--ink` |
| `## H2` | 14px, weight 700, `--ink` |
| `### H3` | 12px, weight 700, `--ink-2`, uppercase |
| `- item` / `* item` | ◆ diamond bullet in `#818cf8` |
| `1. item` | Numbered circle: indigo ring, `#818cf8` index |
| ` ``` block ``` ` | `<pre>` — `--surface-3` bg, `#a78bfa` text, monospace |
| `**bold**` | weight 700, `--ink` |
| `*italic*` | italic, `--ink-2` |
| `` `code` `` | `--surface-3` bg, `#a78bfa`, 0.85em, 4px radius |
| bare URL | `#818cf8` underline, truncated at 50 chars |
| `---` | 1px `--line` horizontal rule |

---

## Spacing & Layout

- **Page wrapper:** `max-width: 680px; margin: 0 auto; padding: 24px 16px 32px`
- **Card internal padding:** `16px–20px` (tighter for dense lists, looser for hero cards)
- **Gap between cards:** `10px–16px` (10 within a section, 16 between sections)
- **Section gap (flex column):** `12px` standard, `10px` in chat

Breakpoints follow Tailwind defaults:
- `md` = 768px — sidebar appears, bottom nav hides, `padding-left: 240px` kicks in

---

## Scrollbar

```css
::-webkit-scrollbar { width: 4px; height: 4px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: var(--line-strong); border-radius: 9999px; }
```

Thin, almost invisible. Matches the overall low-chrome aesthetic.

---

## Component Inventory

| Component | File | Purpose |
|---|---|---|
| `BottomNav` | `components/BottomNav.tsx` | Mobile bottom bar + desktop sidebar |
| `MarkdownMessage` | `components/MarkdownMessage.tsx` | AI reply formatting |
| `ProblemsTab` | `components/ProblemsTab.tsx` | LeetCode problem log (within Log page) |
| `ReviseTab` | `components/ReviseTab.tsx` | Spaced repetition topics (within Log page) |
| `LogEntryForm` | `components/LogEntryForm.tsx` | Log a study session |
| `SessionCard` | `components/SessionCard.tsx` | Grouped log session display |
| `DatePicker` | `components/DatePicker.tsx` | Calendar date input |
| `TimePicker` | `components/TimePicker.tsx` | Time input |

---

## Page Map

| Route | Page | Key UI patterns |
|---|---|---|
| `/` | Today | Log form + daily timeline. Hero mesh on header card. |
| `/focus` | Pomodoro | Full-screen overlay, SVG ring, landscape-aware layout. |
| `/log` | Log | 3-tab: Sessions · Problems · Revise. Filter chips. |
| `/plan` | Plan | Weekly goal setting per category. |
| `/stats` | Stats | 2-tab: Overview (heatmap + bars) · Monthly (delta badges). |
| `/coach` | AI Coach | 3-tab: Chat · Weekly Report · Readiness. Session cards. |

---

## Do / Don't

**Do**
- Use `--ink-4` for anything the user doesn't need to read (timestamps, separators)
- Apply `.animate-in` to every element that enters the DOM dynamically
- Use `tabular-nums` on all numbers that change or align in columns
- Keep card padding consistent: `16px` tight, `20px` default
- Use `border-radius: 12px` for cards, `8px` for inputs/chips, `9999px` for pills

**Don't**
- Don't use `white-space: pre-wrap` for AI output — use `<MarkdownMessage>`
- Don't add `box-shadow` to cards (borders do the job; shadows break the flat aesthetic)
- Don't use opacity for disabled text — use `--ink-4` colour instead
- Don't invent new accent colours — extend the existing semantic set (`--green`, `--amber`, `--red`)
- Don't add a light mode toggle — the app is dark-only by design
