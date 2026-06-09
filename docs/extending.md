# Extending the Project

Step-by-step recipes for adding exercises, questions, and option cards without breaking the
quiz logic, paths, or styling.

- [Golden rules](#golden-rules)
- [Add a new MCQ exercise (math / GK / science)](#add-a-new-mcq-exercise-math--gk--science)
- [Add the exercise to its options page](#add-the-exercise-to-its-options-page)
- [Add or edit questions in an existing bank](#add-or-edit-questions-in-an-existing-bank)
- [Add a new English drag-and-drop or audio exercise](#add-a-new-english-drag-and-drop-or-audio-exercise)
- [Path checklist by folder depth](#path-checklist-by-folder-depth)

---

## Golden rules

1. **Keep the DOM contract.** Reuse the exact ids/classes the engines expect
   (`#question-text`, `#options-list`, `#feedback`, `#explanation`, `#next-btn`,
   `#back-btn`, `.quiz-container`). Don't rename them.
2. **Keep the placeholders + partials.** Every page needs
   `#site-header-placeholder`, `#site-footer-placeholder`, and a `js/partials.js` include.
3. **`correct` must equal one option exactly.**
4. **Use relative paths** for in-page `<link>`/`<script>`/`<img>` based on the file's
   depth (see the [path checklist](#path-checklist-by-folder-depth)).
5. **Don't open with `file://`** while testing — serve over HTTP.

---

## Add a new MCQ exercise (math / GK / science)

The simplest path is to **copy an existing file** in the same folder (so the relative
paths are already correct) and replace its content.

1. Copy, e.g., `question/Level 1 Maths/level_1_addition_upto_5.html` to a new name in the
   same folder.
2. Update the `<title>`.
3. Replace the `const questions = [ ... ]` array with your questions (ideally 100 to keep
   the 25-of-100 behavior; fewer is allowed and will simply show all, shuffled).
4. Leave the rest of the page untouched — the `<head>` stylesheet link, the placeholders,
   the script includes, and the `initMCQQuiz(questions)` call.

Minimal question array:

```html
<script>
  const questions = [
    { question: "What is 2 + 2?", options: ["3", "4"], correct: "4", explanation: "2 + 2 = 4" },
    // ... up to 100
  ];
</script>
```

> For math, prefer adding the topic to `gen_questions.py` and regenerating, so the bank
> stays correct-by-construction and reaches a clean 100. See
> [Question Banks](question-banks.md).

---

## Add the exercise to its options page

A new exercise file is invisible until a card links to it. Edit the matching options page
in `start-page2/Level 1/`:

| Subject | Options page |
|---|---|
| Math | `Level1_math_options.html` |
| Science | `Level1_science_options.html` |
| GK | `Level1_gk_options.html` |
| English | `subject_level1_english_options.html` |

Copy an existing card block and update the badge number, icon, title, description, and
link:

```html
<div class="card" data-level="48">
  <div class="card-icon">➕</div>
  <h3 class="card-title">Addition to 60</h3>
  <p class="card-desc">Add bigger numbers</p>
  <a href="../../question/Level 1 Maths/level_1_addition_upto_60.html" class="card-btn">Start</a>
</div>
```

- `data-level` is the badge text (top-left of the card).
- The card colour is assigned automatically by the `nth-child` cycle — no extra CSS needed.
- The `href` is **relative to the options page** (`../../question/...`).

---

## Add or edit questions in an existing bank

You can hand-edit the `const questions` array directly. Keep it valid:

- Each object needs `question`, `options`, `correct` (and optionally `explanation`,
  `image`).
- `correct` string-identical to one option.
- Unique question texts within the file.
- If you maintain the 100-count, the 25-of-100 logic is unaffected.

If the bank was machine-generated and you want to regenerate it, run the relevant script
(`gen_questions.py` or `gen_gk.py`) — but note that **regenerating overwrites manual
edits** to the `questions` array.

---

## Add a new English drag-and-drop or audio exercise

These use different engines and DOM structures — **copy an existing example** rather than
an MCQ page:

- **Drag-and-drop:** copy a file under
  `question/level-1/English/level1_eng_drag_&_drop/`. It links `css/question.css` +
  `css/dnd.css`, loads `js/drag_and_drop.js`, defines a `questions` array, and calls
  `initTwoBoxSortQuiz(questions)` (sorting/ordering) or `initDragDropQuiz(questions)`
  (single blank). Match the box markup (`.two-targets > .dropbox[data-box]`) the engine
  expects.
- **Audio:** copy a file under `question/level-1/English/level1_eng_sight_words/`. It links
  `css/audio_style.css` + `css/index.css`, loads `js/audio.js`, and provides a `questions`
  list with `voice`/`options`/`correct` fields plus the audio DOM ids (`#playBtn`,
  `#options`, `#prevBtn`, `#nextBtn`, etc.).

These engines have their own fixed question lists and are **not** subject to the MCQ
25-of-100 behavior.

---

## Path checklist by folder depth

In-page `<link>`/`<script>`/`<img>` paths are relative to the file. Match the prefix to the
depth:

| File location | Prefix to reach root | Example CSS link |
|---|---|---|
| `/index.html` | `` (none) | `css/index.css` |
| `/pages/x.html` | `../` | `../css/index.css` |
| `/start-page2/Level 1/x.html` | `../../` | `../../css/index.css` |
| `/question/Level 1 Maths/x.html` | `../../` | `../../css/question.css` |
| `/question/level-1/English/sub/x.html` | `../../../../` | `../../../../css/question.css` |

The header/footer/logo/favicon paths are handled automatically by `partials.js` regardless
of depth — you only need to get the **in-page** relative paths right.
