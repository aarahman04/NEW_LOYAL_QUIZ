# Prompt: catalogue new Loyal MCQs exercises into the existing reference

Use this when you add new exercise files (10, 15, 100 — any number) and want them
recorded in `EXERCISE_REFERENCE.md` and `exercise-inventory.json` in **exactly the
same shape** as the 152 already there, so the two files stay a single continuous
catalogue instead of drifting apart.

**How to use it:** copy everything between the `--- BEGIN PROMPT ---` and
`--- END PROMPT ---` markers into Claude (or any capable AI) with the repository
attached, and replace the `<<< … >>>` placeholder with the list of files you added.

A short skeleton of the classifier script it should reuse is in
[§ Reference: the analysis method](#reference-the-analysis-method) at the bottom —
point the AI at it so it re-derives counts instead of guessing.

---

--- BEGIN PROMPT ---

## Task

I have added new exercise files to the Loyal MCQs repository. Update the existing
documentation so the new exercises are catalogued identically to the existing ones.

**New/changed files:**

```
<<< list the new exercise file paths here, e.g.
question/Level 1 Maths/level_1_multiplication_till_20.html
question/level-1_Science/level1_sci_magnets.html
...
or write "detect them yourself by comparing against exercise-inventory.json" >>>
```

## Ground rules

1. **Do not modify any existing exercise file, stylesheet, script, or image.** This
   is a documentation task only. Create/update documentation files, nothing else.
2. **Do not guess.** Every number, class name, colour and file path you write must
   come from actually reading the repository. If something cannot be determined,
   write `UNKNOWN — requires manual verification` and say why.
3. **Do not re-type existing content.** `EXERCISE_REFERENCE.md` and
   `exercise-inventory.json` already exist and are correct as of the last run.
   Extend and correct them; don't rewrite them from scratch.
4. **Re-derive all counts programmatically**, never by hand. Totals appear in
   several places (§1.2, §2.1, §2.2, §2.3, §3, §9.6, §12) and all of them must stay
   consistent with each other and with the JSON.

## Step 1 — Read the existing contract first

Read these before doing anything else, so your output matches their conventions:

* `EXERCISE_REFERENCE.md` — especially **§3 (taxonomy)**, **§11 (template mapping)**
  and **§13 (recommended data model)**.
* `exercise-inventory.json` — the exact field names and value vocabulary you must reuse.
* `js/script.js`, `js/tap_select.js`, `js/drag_and_drop.js`, `js/audio.js` — the four engines.
* `css/question.css`, `css/tap_select.css`, `css/dnd.css`, `css/audio_style.css`.

## Step 2 — Analyse each new file from its source

For every new file, extract by parsing/evaluating the file — not by reading its name:

* Linked stylesheets and script `src`s, and which `init…Quiz` function is called
  (or none, if it is an audio page that auto-runs).
* The DOM skeleton: which of `#question-text`, `#options-list`, `#tap-grid`,
  `#choices`, `.two-targets`, `.dropbox[data-box]`, `#instruction`, `#options`,
  `#playBtn`, `#feedback`, `#explanation`, `#next-btn` are present.
* The question bank: evaluate the inline `const questions = [...]` in a sandbox
  (some banks are built with `.map()` rather than written out literally — see
  `level_1_eng_sight_words1.html`). Then record:
  * total question count;
  * every key that appears, with a per-key count;
  * distribution of `options.length` (or `items.length`);
  * how many questions have `image`, `explanation`, `alt`, `layout`, `count`, `key`, `voice`;
  * whether `question` strings contain HTML, emoji, `___` blanks, or leading `"1. "` numbering;
  * whether option/item labels contain HTML (`<img>`, `<span style=…>`), emoji, or inline `font-size`;
  * how many questions have more than one `correct: true`.
* Every referenced image path: resolve it relative to the file and **check the file
  actually exists on disk**. Record unique count, missing count, and the folders used.
* Whether any menu page under `start-page*/` or `index.html` links to the file.

## Step 3 — Classify

Assign each new exercise an `engine` and a `variant` **from the existing vocabulary
in §3**:

```
engine:  mcq | tap-select | drag-drop | audio

variant: mcq.plain-text | mcq.rich-text-question | mcq.image-per-question
       | mcq.image-shared-diagram | mcq.image-story-passage | mcq.emoji-quantity-options
       | tap.size-compare | tap.quantity-compare | tap.spatial | tap.grid-match
       | tap.count-n | tap.scene-count
       | dnd.sort-two-box | dnd.order-four-box | dnd.inline-blank | dnd.mixed-demo
       | audio.listen-and-choose
```

Also assign the applicable `traits` from the existing list: `html-in-question`,
`bank-size-not-100`, `fill-in-the-blank`, `mixed-option-count`, `mixed-item-count`,
`some-questions-missing-explanation`, `missing-image-files`, `layout-row`,
`layout-column`, `multi-correct-questions`, `single-correct-questions`,
`stray-initMCQQuiz-call`, `leading-numbering-stripped-at-runtime`.

**Only invent a new variant if the exercise genuinely needs different rendering,
layout, or answer-checking logic.** Different question wording, a different subject,
or a different number of options is *not* a new variant — MCQ files with 2, 3 and 4
options all share one stacked-column layout and are one variant.

If you do add a new variant:

* name it `<engine>.<kebab-case-descriptor>`, matching the existing style;
* add a full subsection to the relevant chapter of `EXERCISE_REFERENCE.md` using the
  **same subsection template** as the existing variants:
  *visual description → screenshot → representative example files with a one-line
  reason each → HTML structure → data shape → CSS classes and key properties →
  JavaScript behaviour → answer model → assets → variations*;
* add it to the §3 taxonomy list, the §2.1 counts table, and the §11
  variant→template mapping table;
* explain in one sentence why it could not be folded into an existing variant.

If a new exercise needs a **new HTML skeleton or a new engine**, add a new template
row (T6, T7, …) to §11 and document the skeleton.

## Step 4 — Capture a screenshot for any new variant

Only if you added a new variant (existing variants already have references).

1. Serve the repo over HTTP — the header/footer partials and asset paths do not
   resolve over `file://`:
   `python3 -m http.server 8753`
2. Drive Chromium with Playwright. Seed `Math.random` via `page.addInitScript` before
   load so the 25-of-N draw is reproducible.
3. Screenshot the `.quiz-container` element (not the full page) at viewport
   900 × 1000, `deviceScaleFactor: 2`.
4. Hide `#emoji-rain` before shooting so the celebration doesn't obscure the card.
5. Save to `docs/exercise-reference/<variant-slug>.png` and reference it from the
   new subsection. Capture the answered state too if the result styling is
   distinctive.

## Step 5 — Update `exercise-inventory.json`

Append one object per new exercise, using the **exact existing schema** (do not
rename, drop or add fields without saying so):

```json
{
  "file": "question/…/…html",
  "title": "…",
  "level": "Level 1",
  "subject": "Math",
  "engine": "mcq",
  "engineFile": "js/script.js",
  "variant": "mcq.plain-text",
  "variantLabel": "Plain text question + text options",
  "traits": [],
  "linkedFrom": ["start-page2/Level 1/Level1_math_options.html"],
  "bank": {
    "questionCount": 100,
    "questionsShownPerAttempt": 25,
    "randomised": true,
    "dataKeys": { "question": 100, "options": 100, "correct": 100, "explanation": 100 },
    "optionCountDistribution": { "2": 100 },
    "itemCountDistribution": {},
    "withExplanation": 100,
    "withImage": 0
  },
  "answerModel": "…",
  "dropBoxes": [],
  "css": ["css/question.css"],
  "cssLinkedInFile": ["../../css/question.css"],
  "jsLinkedInFile": ["../../js/partials.js", "../../js/script.js"],
  "initCalls": ["initMCQQuiz"],
  "assets": { "uniqueImages": 0, "missingImages": 0, "imageFolders": [] },
  "sampleQuestion": { },
  "notes": []
}
```

Then update the top-level header block: `generatedOn`, `totalExerciseFiles`,
`engineCounts`, `variantCounts`. Keep `exercises` sorted by `file`.

## Step 6 — Update `EXERCISE_REFERENCE.md`

Update **every** place a count appears:

* §1.2 headline numbers (file counts, total questions, per-engine, per-subject).
* §2.1 category/variant table (files **and** questions per variant).
* §2.2 MCQ option-count totals, if MCQ files were added.
* §2.3 bank-size summary.
* §3 traits table counts.
* Each affected chapter heading (`## 4. MCQ — N files`, etc.).
* The relevant variant subsection's "Example files" table — add the new file **only
  if it is a better or more current illustration** than what's there; otherwise
  leave the examples alone and rely on §12.
* §9.6 bank-size list, if any new bank isn't exactly 100.
* §11 template mapping, if templates or variants changed.
* **§12 full inventory table — add one row per new exercise, keeping the sort order
  and renumbering the `#` column.**

Add to **§8 (Outliers)** if a new exercise has an unusual layout, custom CSS, custom
JS, unique interaction, unusual answer logic, missing assets, or is unreachable from
the menus.

Add to **§9 (Inconsistencies)** if a new exercise repeats or introduces an
inconsistency — a different class name for the same state, a different feedback
string, a stray init call, a non-100 bank, a naming-convention break, a broken menu
link. **Document it; do not fix it.**

## Step 7 — Verify before you finish

Report explicitly on each of these:

* [ ] Every exercise HTML file in the repo appears exactly once in `exercise-inventory.json`.
* [ ] Every entry has an `engine` and a `variant` from the approved vocabulary.
* [ ] `totalExerciseFiles` equals `exercises.length` equals the §12 row count equals
      the §1.2 figure.
* [ ] Per-variant counts in §2.1 sum to the total, and match `variantCounts` in the JSON.
* [ ] Every `![…](docs/exercise-reference/….png)` path in the markdown resolves.
* [ ] Every image path referenced by a new bank was checked against disk; misses are
      recorded in `assets.missingImages` **and** in §8.2.
* [ ] Every new variant has a visual description, a screenshot, example files, HTML
      structure, CSS, JS behaviour and answer model.
* [ ] No file outside `EXERCISE_REFERENCE.md`, `exercise-inventory.json`,
      `ADDING_EXERCISES_PROMPT.md` and `docs/exercise-reference/` was created or
      modified. Confirm with `git status`.

Finish with a short summary: how many exercises were added, their engine/variant
breakdown, any new variants introduced and why, and any new outliers or
inconsistencies found.

--- END PROMPT ---

---

## Reference: the analysis method

The original catalogue was produced this way. Reuse it so results stay comparable.

**Parsing the banks.** Question banks are JavaScript object literals inside inline
`<script>` tags, and some are generated with `.map()`. Regex parsing is unreliable;
evaluate them instead. In Node:

```js
const vm = require('vm');

// Collect every inline <script> body (skip ones with a src attribute).
let inline = '';
for (const m of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
  if (!/src\s*=/.test(m[1])) inline += '\n' + m[2];
}

// Stub the browser surface the pages touch, and every engine entry point,
// so evaluation reaches the data instead of throwing.
const sandbox = {
  window: { addEventListener(){}, location: { href: '' } },
  document: {
    addEventListener(){}, getElementById: () => null,
    querySelector: () => null, querySelectorAll: () => [],
    createElement: () => ({ style:{}, classList:{add(){},remove(){}},
                            addEventListener(){}, appendChild(){} }),
    body: { appendChild(){} },
  },
  console: { log(){}, error(){}, warn(){} },
  setTimeout: () => 0, navigator: { userAgent: '' }, alert: () => {},
  speechSynthesis: { getVoices: () => [], cancel(){}, speak(){} },
  addEventListener(){},
};
sandbox.window.document = sandbox.document;
sandbox.globalThis = sandbox;
for (const n of ['initMCQQuiz','initTapSelectQuiz','initDragDropQuiz','initTwoBoxSortQuiz']) {
  sandbox[n] = () => {}; sandbox.window[n] = () => {};
}

const ctx = vm.createContext(sandbox);
vm.runInContext(inline, ctx, { timeout: 5000 });
const bank = vm.runInContext("typeof questions !== 'undefined' ? questions : []", ctx);
```

**Grouping files.** To find how many *genuinely distinct* HTML skeletons exist,
strip `<script>` blocks, comments, `<title>` and all `../` path prefixes, collapse
whitespace, and group by the resulting string. That is how the "13 shells, ~6 real
templates" figure in §9.1 was derived — repeat it after adding files to see whether
you introduced a new shell.

**Screenshots.** See Step 4 above. The originals were captured with
`playwright@1.56.1` against `/opt/pw-browsers/chromium-1194/chrome-linux/chrome`.

**Keep analysis scratch files outside the repository** (e.g. in a temp directory).
Only the four documentation outputs belong in the tree.
