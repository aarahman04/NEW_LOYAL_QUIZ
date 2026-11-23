# KG-3 English grammar worksheets

Added eight exercises from the November 2026 worksheets. Open **KG-3 → English**
to find them. Each page uses the shared multiple-choice engine, draws 25
questions per attempt, and gives feedback and an explanation after each answer.

| Menu position | Exercise | Source PDF | HTML in `question/KG-3_English/` | Questions |
| ---: | --- | --- | --- | ---: |
| 19 | Nouns | `MCQ. Noun.pdf` | `kg3_eng_nouns.html` | 102 |
| 20 | Pronouns | `MCQ. Pronouns.pdf` | `kg3_eng_pronouns.html` | 101 |
| 21 | Verb to Be | `kg3 verb to be.pdf` | `kg3_eng_verb_to_be.html` | 100 |
| 22 | Like / Likes | `like and likes verb .pdf` | `kg3_eng_like_likes.html` | 98 |
| 23 | Eat / Drink | `MCQ Eat_Drink kg.3.pdf` | `kg3_eng_eat_drink.html` | 98 |
| 24 | Where / When | `MCQ. Where_When.pdf` | `kg3_eng_where_when.html` | 100 |
| 25 | What / Where / Why | `MCQ. Where_Why.pdf` | `kg3_eng_what_where_why.html` | 100 |
| 26 | Who / How | `who-how.pdf` | `kg3_eng_who_how.html` | 101 |
| | | | **Total** | **800** |

## Source handling

Every worksheet item appears in its bank in source order, including repeated
items. The counts use actual question-and-choice pairs because the PDFs have
skipped, duplicated, and unprinted numbers. The Nouns worksheet includes
questions with unlettered choices and ends with three pages containing only
page numbers.

The conversion removes printed numbering, standardizes blanks and punctuation,
fixes obvious typos, and capitalizes pronouns that start a sentence. Short cues
specify the intended meaning where two choices can fit. For example, the beach
question in Where / When asks about a time. For Nouns, the cue distinguishes
concrete meanings when a distractor can also be used as a noun.

The source has 45 unmarked items and one doubly marked item. The unmarked choices
were resolved from grammar or clarified by a cue. For the doubly marked Nouns
item, the playground cue makes **swing** the answer. The table lists the changes
to singly marked answer keys. Item numbers refer to positions in the HTML bank.

| Exercise | Bank item | Marked choice → correct choice |
| --- | ---: | --- |
| Nouns | 33, 36 | sing → pillow, cry → cloud |
| Nouns | 48, 49 | swim → cat, swim → dog |
| Nouns | 59, 60 | want → car, go → cat |
| Nouns | 64, 76 | read → book, wipe → house |
| Pronouns | 51, 78 | her → He, it → They |
| Who / How | 3, 9 | How → Who, How → Who |

Choice edits also include **One → Where** in Where / When item 3 and
**Hoo → Who** in Who / How item 3.

## Validation

From the repository root, run `node scripts/validate-kg3-english.mjs`. It checks
all 26 HTML banks, their counts, answer choices, and menu order. An optional
JSON folder can still be supplied to validate the earlier 18 exports.
