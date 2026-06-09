# Glossary

Project-specific terms and conventions used throughout the code and docs.

| Term | Meaning |
|---|---|
| **Exercise / quiz page** | A leaf HTML file under `question/` that contains a `questions` array and runs a quiz engine. |
| **Options page** | A selection grid under `start-page2/` (or `start-page3/`) whose cards link to exercises. Also called a "section" page. |
| **Subject page** | `start-page/subject_level1.html` — chooses between English, Math, Science, GK. |
| **Quiz engine** | A global JS init function that turns a `questions` array + the page DOM into an interactive quiz. Three exist: `initMCQQuiz`, `initDragDropQuiz`/`initTwoBoxSortQuiz`, and the audio engine. |
| **MCQ** | Multiple-choice question — the dominant format (`initMCQQuiz`). |
| **Question bank** | The full `const questions` array in an exercise file. For math/GK it holds **100** items and is the source of truth. |
| **Subset / attempt set** | The random **25** questions drawn from the 100-item bank for a single play-through. |
| **Bank is the source of truth** | The engine never mutates the 100-item array; it shuffles a copy and slices 25. |
| **Partial** | The shared header/footer. Injected at runtime by `js/partials.js` (the `partials/*.html` files are reference copies only). |
| **Placeholder** | `#site-header-placeholder` / `#site-footer-placeholder` — empty divs that `partials.js` replaces. |
| **`PARTIALS_ROOT`** | The site root URL, derived from `partials.js`'s own script URL. All JS-built links/assets are prefixed with it so they work at any depth and on GitHub Pages subdirs. |
| **Design token** | A CSS custom property in `:root` (e.g., `--brand`, `--accent`, `--radius-lg`) declared identically in all four stylesheets. |
| **Legacy alias** | An older token name kept for compatibility (e.g., `--brand-red` → `--brand`, `--correct-bg`). Some selectors still reference these. |
| **Card** | The `.card` component (badge + icon + title + description + Start button) used on selection grids. |
| **Mixed GK file** | `level1_gk_l1..l20.html` — each blends many GK categories; its option card uses a friendly "mix of GK" name rather than a single-topic title. |
| **Topic GK file** | `level1_gk_animals/fruits_veg/colours/my_body/days_months.html` — single-subject GK banks (cards 21–25). |
| **Generator** | An optional Python script (`gen_questions.py`, `gen_gk.py`) that writes the 100-item banks into the HTML by replacing the `questions` array. Tooling, not part of the running site. |
| **Emoji rain** | The decorative falling-emoji feedback after answering (`addEmojiRain`). No effect on scoring. |
| **Off-canvas menu** | The mobile navigation that slides in from the left (`#nav-menu.active`) when the hamburger is tapped at ≤900px. |
