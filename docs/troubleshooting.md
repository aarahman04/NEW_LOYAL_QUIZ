# Troubleshooting

Common symptoms, their likely causes, and how to fix them. Most issues trace back to
**path resolution** or the **partial-injection** step.

- [No header/footer on a page](#no-headerfooter-on-a-page)
- [Logo or favicon missing / broken](#logo-or-favicon-missing--broken)
- [Quiz shows "Loading…" and never starts](#quiz-shows-loading-and-never-starts)
- [Answers never mark correct](#answers-never-mark-correct)
- [Always seems to show the same questions](#always-seems-to-show-the-same-questions)
- [Back/Next buttons visible too early or stuck](#backnext-buttons-visible-too-early-or-stuck)
- [Per-question image not showing](#per-question-image-not-showing)
- [Styles look wrong or inconsistent](#styles-look-wrong-or-inconsistent)
- [Mobile menu won't open](#mobile-menu-wont-open)

---

## No header/footer on a page

**Cause:** `js/partials.js` didn't run, or the placeholders are missing.

**Check:**
- The page includes both `<div id="site-header-placeholder"></div>` and
  `<div id="site-footer-placeholder"></div>`.
- The page loads `js/partials.js` with a correct relative path for its depth.
- You're viewing over **HTTP**, not `file://`.
- The browser console shows no script 404 for `partials.js`.

---

## Logo or favicon missing / broken

**Cause:** `PARTIALS_ROOT` resolved incorrectly, or the asset path is wrong.

**Check:**
- `partials.js` is at `<root>/js/partials.js` (the root is derived by stripping that tail
  from the script's own URL). If you moved the file, update that logic.
- The logo lives at `image/Loyal_International_School_logo.png`; favicons live in
  `favicon/`.
- In the console: `document.querySelector('.logo-icon').src` and
  `document.querySelector('link[rel="icon"]').href` should be absolute URLs under your
  site root. Open them directly — they should return 200.
- The manifest (`favicon/site.webmanifest`) must use **relative** icon `src` values so they
  resolve inside `/favicon/`.

> Historical note: an earlier version guessed the root from `window.location.pathname`,
> which 404'd the logo on nested pages and on flat local servers. The current
> `PARTIALS_ROOT` approach fixes that.

---

## Quiz shows "Loading…" and never starts

**Cause:** the engine wasn't called, the engine script failed to load, or `questions` is
invalid.

**Check:**
- The page loads the right engine (`js/script.js` for MCQ) **before** calling it.
- There is a `DOMContentLoaded` handler calling `initMCQQuiz(questions)`.
- `const questions` is a valid array (a trailing comma or unescaped quote will throw — see
  the console).
- Inline HTML in `question`/`explanation` uses **single quotes** for attributes so it
  doesn't terminate the double-quoted JS string.

---

## Answers never mark correct

**Cause:** `correct` does not exactly match any `options` entry.

**Check:** for the failing question, `correct` must be **string-identical** to one option
(watch for trailing spaces, different casing, or smart quotes vs straight quotes, and for
emoji answers, identical emoji sequences).

---

## Always seems to show the same questions

**Expected behavior:** the MCQ engine draws a **fresh random 25** on every open. If it
appears static:

- Confirm the file actually has more than 25 questions (a bank of ≤25 shows all of them).
- Confirm you're loading the current `js/script.js` (a stale cached copy without
  `pickSubset` would show everything in order). Hard-refresh to bypass cache.
- Reload the page — the subset should change. (Within a single attempt it intentionally
  stays fixed.)

---

## Back/Next buttons visible too early or stuck

**Cause:** the `.hidden` utility isn't winning over the button's own `display`.

**Check:** `css/question.css` defines `.hidden { display: none !important; }`. The
`!important` is required because `#next-btn`/`#back-btn` (id selectors) otherwise outrank a
plain `.hidden` class. Keep it.

---

## Per-question image not showing

**Check:**
- The `image` path is **relative to the exercise file** (e.g.,
  `../../image/level_1_math/number_line_1_to_50.jpg`) and the file exists.
- Number-line math files intentionally reuse one shared image for all questions.
- An empty/absent `image` is normal — the engine hides the image element.

---

## Styles look wrong or inconsistent

**Check:**
- The page links the correct stylesheet for its type (MCQ → `question.css`; options/home →
  `index.css`; drag-and-drop → `question.css` + `dnd.css`; audio → `audio_style.css` +
  `index.css`).
- You didn't remove the `:root` token block or the **legacy aliases**
  (`--brand-red`, `--correct-bg`, etc.) that some selectors depend on.
- Google Fonts loaded (offline? the system-font fallback stack still renders cleanly).

---

## Mobile menu won't open

**Cause:** the hamburger toggle didn't bind, or the markup ids changed.

**Check:**
- `partials.js` injected `#hamburger` and `#nav-menu` (they're part of the generated
  header).
- Clicking the hamburger should toggle the `.active` class on both. The off-canvas styles
  live under the `@media (max-width: 900px)` block in `css/index.css`.
