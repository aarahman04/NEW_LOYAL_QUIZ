# UI & Styling

The design language, the four stylesheets, the shared design tokens, the main components,
responsiveness, and asset handling.

- [Design language](#design-language)
- [The four stylesheets](#the-four-stylesheets)
- [Design tokens](#design-tokens)
- [Typography](#typography)
- [Core components](#core-components)
- [States: hover, focus, active, feedback](#states-hover-focus-active-feedback)
- [Responsive behavior](#responsive-behavior)
- [Assets: images, icons, favicon, fonts](#assets-images-icons-favicon-fonts)

---

## Design language

Friendly and child-appropriate, but clean and modern — not cartoonish. The system uses:

- A warm **brand red** (`#e23744`) for headings, accents, and the header/footer rule.
- An **indigo accent** (`#4f46e5`) for interactive elements (option chips, primary
  buttons, focus rings).
- Soft neutral surfaces, generous spacing, rounded corners, and subtle shadows.
- Rounded, approachable fonts (Baloo 2 + Nunito).
- Tasteful motion (hover lift, emoji rain), with a `prefers-reduced-motion` fallback.

---

## The four stylesheets

There is no global concatenated CSS. Each page links only what it needs, but **all four
files declare the same `:root` tokens**, so components match no matter which is active.

| File | Owns | Loaded by |
|---|---|---|
| `css/index.css` | Base reset, header, footer, hero, **cards & card-grid**, page titles, loader, emoji rain | Home, all `*_options` pages, About/Contact, and (co-loaded) audio pages |
| `css/question.css` | The MCQ **quiz shell**: `.quiz-container`, `#question-text`, `.options`, feedback/explanation, quiz buttons, completion | All MCQ exercises (math, GK, science, most English) |
| `css/dnd.css` | Drag-and-drop **layer**: `.draggable`, `.dropzone`, `.two-targets`, `.dropbox` and their state colours | Drag-and-drop English exercises (with `question.css`) |
| `css/audio_style.css` | Audio page controls: `.controls-row`, `.btn`, `.options button`, `.feedback`, progress/nav | Audio sight-word exercises (with `index.css`) |

> Some pages load **two** stylesheets (drag-and-drop = `question.css` + `dnd.css`; audio =
> `audio_style.css` + `index.css`). Because the token values and component looks are kept
> identical across files, load order does not cause visual drift.

---

## Design tokens

Defined in `:root` at the top of each stylesheet. Use these variables instead of
hard-coded values when editing styles.

| Group | Tokens (examples) |
|---|---|
| Brand / accent | `--brand` `#e23744`, `--brand-dark`, `--accent` `#4f46e5`, `--accent-dark` |
| Semantic | `--success` `#16a34a`, `--danger` `#dc2626` |
| Surfaces / text | `--bg` `#f4f6fb`, `--surface` `#fff`, `--surface-soft` `#fff7ec`, `--text`, `--muted`, `--border` |
| Typography | `--font-body` (Nunito), `--font-display` (Baloo 2) |
| Radii | `--radius-sm/md/lg`, `--radius-pill` |
| Shadows | `--shadow-sm/md/lg` |
| Motion | `--transition`, `--focus-ring` |
| Legacy aliases | `--brand-red`, `--primary-blue`, `--light-bg`, `--correct-bg`, `--incorrect-bg`, `--btn-bg`, `--btn-hover` (kept so older selectors keep working) |

> **Keep the legacy aliases.** Several selectors in `question.css`/`dnd.css` reference them
> (e.g., `--brand-red`, `--correct-bg`). They map onto the modern tokens.

---

## Typography

- **Display / headings:** `Baloo 2` (rounded, friendly).
- **Body / UI:** `Nunito`.
- Loaded via a Google Fonts `@import` at the top of each stylesheet, with a robust system
  fallback stack (`system-ui, -apple-system, 'Segoe UI', Roboto, ...`).
- Headings often use `clamp()` for fluid sizing across screen sizes.

> An earlier Comic Sans approach (and a local `image/fonts/comic-sans.woff`) was replaced
> by Baloo 2 + Nunito. The local font file may remain in `image/fonts/` but is no longer
> the active typeface.

---

## Core components

| Component | Selector(s) | Notes |
|---|---|---|
| Header | `.site-header`, `.header-inner`, `.logo`/`.logo-link`, `.logo-icon`, `.main-nav`/`#nav-menu`, `.hamburger` | Sticky, white, brand-red bottom rule; injected by `partials.js` |
| Footer | `.site-footer`, `.footer-inner`, `.footer-section`, `.footer-links`, `.social-links` | Grid; injected by `partials.js` |
| Hero | `.hero`, `.hero-card` | Home page only |
| Page title | `.page-title` | Centered display heading; has a gradient accent underline |
| Card grid | `.card-grid` | Responsive `auto-fit` grid |
| Card | `.card`, `.card-icon`, `.card-title`, `.card-desc`, `.card-btn`, `::before` badge | Used for level/subject/exercise selection; per-card colour via `--card-color` |
| Quiz container | `.quiz-container` | White rounded card holding the active question |
| Options | `.options`, `.mcq-option`, `.option-label`, `.option-text`, `.icon` | Answer chips; `.correct`/`.incorrect` state colours |
| Feedback | `#feedback`, `#explanation` | Result message + solution block |
| Buttons | `#next-btn`, `#back-btn`, `.btn`, `.btn-home`, `.start-btn` | Pill shaped; accent fill or outline |

**Card colour cycling.** Cards take their accent from `--card-color`. Option/section pages
cycle through a palette via `main.startpage .card:nth-child(7n+k)` rules, so a long grid
stays colourful without per-card styling.

---

## States: hover, focus, active, feedback

- **Hover:** cards lift (`translateY`) with a larger shadow; the card icon nudges/scales;
  buttons darken and lift.
- **Active/pressed:** buttons settle back down (`translateY(1px)` / `translateY(0)`).
- **Focus:** a visible `--focus-ring` (`box-shadow`) appears on keyboard focus
  (`:focus-visible`) for card links and buttons — important for accessibility.
- **Answer feedback:** `.correct` → green surface/border; `.incorrect`/`.wrong` → red.
  Feedback never relies on colour alone — a ✔/✖ icon is also shown.
- **Reduced motion:** a `@media (prefers-reduced-motion: reduce)` block in `index.css`
  neutralizes transitions/animations and disables the hover lift.

---

## Responsive behavior

- **Card grids** use `repeat(auto-fit, minmax(220px, 1fr))`, collapsing from multi-column
  to single-column on small screens.
- **Header nav** switches at `≤900px`: the inline nav becomes an **off-canvas menu**
  toggled by the hamburger (`#hamburger.active` ↔ `#nav-menu.active`). At `≥901px` it is a
  normal inline row.
- **Quiz containers**, hero, and footer reflow and reduce padding at `768px`, `600px`, and
  `480px` breakpoints.
- Tap targets (options, buttons) stay comfortably large for young users.

---

## Assets: images, icons, favicon, fonts

| Asset type | Location | Path handling |
|---|---|---|
| Logo | `image/Loyal_International_School_logo.png` | Built as `PARTIALS_ROOT + "image/..."` by `partials.js` |
| Question images | `image/` (and subfolders, e.g., `image/level_1_math/`) | Referenced **relatively** from each exercise file (e.g., `../../image/...`) |
| Footer icons | Bootstrap Icons CDN | Injected by `partials.js` |
| Favicons | `favicon/` (`.svg`, `.ico`, `96x96`, `apple-touch-icon`, `web-app-manifest-*`) | Injected into `<head>` by `partials.js` using `PARTIALS_ROOT` |
| Web manifest | `favicon/site.webmanifest` | Icon `src` values are **relative** so they resolve inside `/favicon/` |
| Fonts | Google Fonts (CSS `@import`); legacy `image/fonts/comic-sans.woff` | Active fonts come from Google Fonts |

> **Two path strategies coexist by design:**
> - *JavaScript-built* links/assets (logo, favicons, nav) use the absolute, root-derived
>   `PARTIALS_ROOT` — robust at any depth.
> - *In-page* assets (per-question images, stylesheet `<link>`s) use **relative** paths
>   from the file's own location (`../../...`). Keep these correct when moving files.
