# KG3 English update - 18 October 2026

Implemented the supplied English PDFs in the existing static quiz site and synchronized the external KG3 English JSON folder. This report covers the English changes; math is handled separately. The JSON exports are outside this Git repository and remain in the data folder listed below.

## Delivered

- 10 new HTML exercises and a refreshed SH Words exercise; the six other existing English banks are preserved.
- 712 cropped/reused illustrations for the supplied picture quizzes, organized by exercise under `image/`.
- Uppercase-to-lowercase and lowercase-to-uppercase matching: 26 questions each, one per letter, three large choices with handwriting guide lines, question followed by a prominent letter and then choices.
- 17 cards in the KG3 English menu, with Match upper case and Match lower case first.
- 17 JSON files, 1,554 total questions, in `C:\Users\aarah\Downloads\update data\LOYAL MCQ_S DATA\kg3\english`.
- All five original JSON question arrays are preserved exactly. Their metadata now follows menu order. Vowel E retains its existing shared media storage keys.
- The shared MCQ engine now supports Enter/Space on options, exposes button roles, and disables answered choices. Existing question selection, scoring, and feedback behavior are unchanged.

## Exercise banks

| Exercise | HTML in `question/KG-3_English/` | Questions | JSON |
|---|---|---:|---|
| Match upper case | `kg3_eng_uppercase.html` | 26 | `eng-uppercase.json` |
| Match lower case | `kg3_eng_lowercase.html` | 26 | `eng-lowercase.json` |
| Consonant | `kg3_eng_consonants_mcq.html` | 100 | `eng-consonants-mcq.json` |
| Vowels | `kg3_eng_vowels_mcq.html` | 100 | `eng-vowels-mcq.json` |
| Vowel a | `kg3_eng_vowel_a.html` | 100 | `eng-vowel-a.json` |
| Vowel e | `kg3_eng_vowel_e.html` | 100 | `eng-vowel-e.json` |
| Vowel i | `kg3_eng_vowel_i.html` | 100 | `eng-vowel-i.json` |
| Vowel o | `kg3_eng_vowel_o.html` | 101 | `eng-vowel-o.json` |
| Vowel U | `kg3_eng_vowel_u.html` | 91 | `eng-vowel-u.json` |
| Words Sh | `kg3_eng_sh_words.html` | 100 | `eng-sh-words.json` |
| Words Ch | `kg3_eng_ch_words.html` | 110 | `eng-ch-words.json` |
| Singular Form | `kg3_eng_singular_form.html` | 96 | `eng-singular-form.json` |
| plural Form | `kg3_eng_plural_form.html` | 105 | `eng-plural-form.json` |
| Cocktail Plural/ Singular | `kg3_eng_plural_singular.html` | 100 | `eng-plural-singular.json` |
| Articles A/An | `kg3_eng_a_an.html` | 100 | `eng-a-an.json` |
| Have/ Has | `kg3_eng_have_has.html` | 101 | `eng-have-has.json` |
| Do/ Did | `kg3_eng_do_did.html` | 98 | `eng-do-did.json` |

Exercise display names and order match the user's 17-item list. JSON titles and zero-based `order_index` values match the menu. Existing filenames, slugs, questions, answers, and media references are preserved.

Each attempt still draws 25 questions using the existing shared engine. Counts reflect actual nonblank source questions; banks were not padded or truncated to force 100. The uppercase PDF is an example, so its two directions were authored as letter-matching banks.

Letter matching now has 26 questions per bank, one for each English letter. Each attempt draws 25 shuffled letters without repetition. Both the prompt and answer choices show a solid top guide, dashed middle guide, solid baseline, and room for descenders. The prompt guides are self-contained SVG in the HTML and JSON; choice guides are rendered by `js/kg3-letters.js`. Other question banks and their content are unchanged.

## Source handling

894 underlined answer selections were preserved exactly. Five duplicate distractors were repaired without changing the underlined selection. Question wording received formatting cleanup only: redundant numbering/headings, blank markers, quote spacing, and the words ?single form? were normalized. Underlined spelling/answer inconsistencies were retained rather than silently changing the source key.

Blank PDF pages omitted: CH Words 86, 112?113; Plural Form 106?119; Singular Form 97; Vowel O 102; SH Words 94 and 102. All other source questions are included in source order.

### Questions without an underline

These 17 source exceptions use inferred keys. **Do/Did PDF questions 62 and 70 have neither an underline nor a time clue; "do" is a present-tense assumption and needs the author?s confirmation.** Both source options remain unchanged. The user explained the underline convention but did not supply keys for these two unmarked questions.

Bank Q is the sequential output question number; PDF Q is the printed source number, which sometimes skips or repeats.

| Exercise | Bank Q | PDF page | PDF Q | Key | Basis |
|---|---:|---:|---:|---|---|
| do_did | 10 | 2 | 10 | did | Grammar / stated task |
| do_did | 18 | 4 | 18 | did | Grammar / stated task |
| do_did | 52 | 9 | 62 | do | Present-tense assumption; author review needed |
| do_did | 60 | 10 | 70 | do | Present-tense assumption; author review needed |
| do_did | 65 | 10 | 75 | did | Grammar / stated task |
| do_did | 79 | 12 | 89 | did | Grammar / stated task |
| a_an | 82 | 82 | 84 | a book | Grammar / stated task |
| plural_singular | 51 | 51 | 56 | socks | Grammar / stated task |
| have_has | 21 | 3 | 22 | has | Grammar / stated task |
| have_has | 52 | 7 | 53 | have | Grammar / stated task |
| have_has | 99 | 13 | 100 | have | Grammar / stated task |
| have_has | 101 | 13 | 100 | have | Grammar / stated task |
| singular_form | 21 | 21 | 22 | bee | Grammar / stated task |
| singular_form | 46 | 46 | 50 | bag | Grammar / stated task |
| sh_words | 3 | 3 | 3 | ship | Illustration; repeated marked picture confirms shy for SH Q8 |
| sh_words | 8 | 8 | 8 | shy | Illustration; repeated marked picture confirms shy for SH Q8 |
| sh_words | 90 | 90 | 89 | shoe | Illustration; repeated marked picture confirms shy for SH Q8 |

### Duplicate choices repaired

| Exercise | Bank Q / PDF page | Choices before | Choices after | Preserved key |
|---|---|---|---|---|
| a_an | 100 / 100 | an animal / an animal | an animal / a animal | an animal |
| ch_words | 20 / 20 | cherry / cherry | cheese / cherry | cherry |
| plural_form | 10 / 10 | goats / goats | goats / goat | goats |
| plural_form | 16 / 16 | tigers / tigers | tigers / tiger | tigers |
| plural_form | 17 / 17 | bears / bears | bears / bear | bears |

### Missing source illustrations

- A/An Q46 (egg): reused the matching egg illustration from the same PDF, page 47.
- Singular Form Q6 (hens): reused the matching hens illustration from Plural Form, page 6.
- Vowel O Q20 (rob): reused the repository?s existing labelled rob illustration, `image/level1_eng_reading_vocabulary_3/95.png`, cropped into `image/KG_3_Vowel_O/20.png`.

### Source content still needing editorial review

The following are examples noticed while reviewing the original images. They are preserved to honor the supplied underlined keys; this is not a complete curriculum proofread.

| Source | Bank Q | Retained source issue |
|---|---:|---|
| A/An | 17 | Underlined ?an mat?; normal grammar would use ?a mat?. |
| CH Words | 49?51 | Chilli-pepper pictures are keyed as ?chilly?. |
| CH Words | 74 | Picture shows several children, but ?child? is underlined. |
| Singular Form | 49 | Spoon illustrations accompany a plates/plate question. |
| Singular Form | 59 | Distractor is spelled ?teachet?. |
| Singular Form | 95 | Prompt uses ?deers? instead of ?deer?. |
| Plural Form | 49 | Spoon illustrations accompany an underlined ?plates? answer. |
| Plural Form | 50 | Sock illustration accompanies an underlined ?shoes? answer. |
| Plural Form | 72 | Penguin illustrations accompany a rabbits question. |
| Plural Form | 73 | Plural task has the singular ?owl? underlined. |
| Plural Form | 102 | Fruit-basket picture accompanies an underlined ?pictures? answer. |
| Singular / Plural Mix | 95 | Singular task has ?circles? underlined; no ?circle? choice. |
| Vowel O | 25 | Lightning-bolt picture is keyed as ?blot?. |

## Media and JSON compatibility

HTML loads local PNGs. JSON follows the supplied schema, including the existing `.webp` storage-key convention in `media.path` and the actual PNG location in `media.source_path`. Vowel E keeps its original `questions/shared/` keys. This task does not upload assets or convert/publish them into a downstream storage service; use the existing importer/media pipeline when deploying these JSONs.

## Verification

Run the persistent data check from the repository root:

```powershell
node scripts/validate-kg3-english.mjs "C:\Users\aarah\Downloads\update data\LOYAL MCQ_S DATA\kg3\english"
```

- Passed: 17 banks, 1,554 questions, 1,103 image references, all menu links, unique options/slugs, answer IDs, order, counts, and HTML/JSON parity.
- Passed independent source parity: all 894 underlined selections unchanged; 17 unmarked exceptions accounted for; all 712 final source illustrations are nonblank.
- Visually reviewed contact sheets for all extracted illustrations and the example letter pages.
- Passed Chromium checks on all 17 quizzes: correct/incorrect feedback, image loading, keyboard answers, repeat-answer prevention, Next locking, and progress.
- Passed four full 25-question attempts: Uppercase, Lowercase, CH Words, and Do/Did, including completion and 25/25 scores.
- Passed responsive checks at widths 320px and 375px, with screenshots inspected for both letter directions, picture/sentence quizzes, and the menu. No horizontal overflow.
- Passed `git -c core.whitespace=cr-at-eol diff --check`.

## Local working artifacts

Original-file backups, extraction provenance, cropped-image contact sheets, browser screenshots, and the conversion scripts are in `C:\Users\aarah\Documents\Codex\2026-10-18\kg3-update`. Original PDFs were not modified. The Claude math prompt is `CLAUDE_KG3_MATH_PROMPT.md` in that folder.

Not checked: physical phones, other browser engines, and downstream JSON import/deployment. Main remaining risk: the explicitly listed missing/contradictory source answer keys.
