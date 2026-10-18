# KG3 English Verbs - 19 October 2026

- Source: `C:\Users\aarah\Downloads\update data\kg3 verb.pdf`.
- Exercise: `question/KG-3_English/kg3_eng_verbs.html`, using the existing picture quiz layout and shared MCQ engine (25 random questions per attempt).
- Menu: **Verbs**, the eighteenth KG3 English exercise.
- Images: 101 original 512 x 512 illustrations isolated from the PDF, without question text or answer markings, in `image/KG3 English Verbs/`.
- JSON: `C:\Users\aarah\Downloads\update data\LOYAL MCQ_S DATA\kg3\english\eng-verbs.json`, matching the existing export schema and media path convention.

All 101 pages are included in page order. The PDF repeats question number 93, so sequential website/JSON question 94 corresponds to the second source question numbered 93. Only printed numbering, surrounding whitespace, and missing final prompt punctuation were normalized. Option spelling, capitalization, order, and all 101 underlined answer selections are preserved.

Two source picture/key mismatches are retained for the author to review:

| PDF page / exported question | Printed PDF number | Underlined answer | Picture |
| --- | --- | --- | --- |
| 73 | 73 | untie | Backpack outline |
| 94 | 93 (second occurrence) | run | Person on roller skates |

The JSON uses `.webp` media storage keys and PNG `source_path` values, as the other exports do. This change creates the local PNG sources and JSON; conversion/upload to the data application's media storage is a separate existing import step.

Validate the exercise, menu, local images, and all JSON exports with:

```powershell
node scripts/validate-kg3-english.mjs 'C:\Users\aarah\Downloads\update data\LOYAL MCQ_S DATA\kg3\english'
```
