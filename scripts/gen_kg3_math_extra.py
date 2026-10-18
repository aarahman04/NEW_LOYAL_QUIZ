"""Generate the six extra KG-3 math exercises (HTML pages, JSON exports, ten-frame PNGs).

Run from the repo root:  python scripts/gen_kg3_math_extra.py [json-out-folder]
One source of truth feeds both the page's `const questions` bank and the JSON export,
so the two always match. Deterministic (seeded) so re-runs give the same banks.
"""
import json
import random
import sys
from datetime import datetime, timezone
from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
PAGES = ROOT / "question" / "KG-3_math"
JSON_OUT = Path(sys.argv[1]) if len(sys.argv) > 1 else Path(
    r"C:\Users\aarah\Downloads\update data\LOYAL MCQ_S DATA\kg3\math")
TF_DIR = ROOT / "image" / "kg3_math" / "ten_frame"
BANK = 100


# ---------------------------------------------------------------- helpers
def item(label, correct, choice):
    return {"label": label, "correct": correct, "choice": choice}


def num_item(n, correct):
    return item(str(n), correct, {"text": str(n)})


def emoji_item(e, correct, count=1, group=False):
    label = f'<span class="kg3-group">{e * count}</span>' if group else e * count
    return item(label, correct, {"emoji": e, "count": count})


def num_items(rng, ans, lo, hi, k=4):
    pool = [n for n in range(max(lo, ans - 3), min(hi, ans + 3) + 1) if n != ans]
    picks = rng.sample(pool, k - 1) + [ans]
    rng.shuffle(picks)
    return [num_item(n, n == ans) for n in picks]


def q(html, prompt, items, exp, **extra):
    return {"html": html, "prompt": prompt, "items": items, "exp": exp, **extra}


def scene(e, n):
    return f'<span class="tap-scene">{e * n}</span>'


def collect(rng, makers, quotas):
    """Draw unique questions from each maker until its quota is met."""
    out, seen = [], set()
    for make, quota in zip(makers, quotas):
        got, tries = 0, 0
        while got < quota:
            tries += 1
            assert tries < 20000, f"{make.__name__} cannot reach {quota} unique questions"
            x = make(rng)
            key = (x["prompt"], json.dumps([i["choice"] for i in x["items"]], ensure_ascii=False), x.get("image"))
            if key in seen:
                continue
            seen.add(key)
            out.append(x)
            got += 1
    rng.shuffle(out)
    return out


COUNT_WORDS = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"]


def count_list(n):
    return ", ".join(str(i) for i in range(1, n + 1))


# ---------------------------------------------------------------- 1. ten frame
TF_COLORS = [("red", (220, 38, 38)), ("blue", (37, 99, 235)), ("green", (22, 163, 74)),
             ("orange", (234, 88, 12)), ("purple", (147, 51, 234)), ("teal", (13, 148, 136))]
CELL, PAD = 110, 20


def tf_cells(n, style):
    if style < 4:                       # standard fill: top row left to right, then bottom row
        return list(range(n))
    return sorted(random.Random(n * 10 + style).sample(range(10), n))   # scattered


def draw_ten_frame(n, style):
    w, h = CELL * 5 + PAD * 2, CELL * 2 + PAD * 2
    img = Image.new("RGB", (w * 2, h * 2), "white")      # draw at 2x, downsample for smooth edges
    d = ImageDraw.Draw(img)
    s = 2
    d.rounded_rectangle([PAD * s, PAD * s, (w - PAD) * s, (h - PAD) * s], radius=14 * s,
                        fill=(255, 251, 240), outline=(55, 65, 81), width=6 * s)
    for c in range(1, 5):
        x = (PAD + c * CELL) * s
        d.line([x, PAD * s, x, (h - PAD) * s], fill=(55, 65, 81), width=4 * s)
    d.line([PAD * s, (PAD + CELL) * s, (w - PAD) * s, (PAD + CELL) * s], fill=(55, 65, 81), width=4 * s)
    color = TF_COLORS[style][1]
    dark = tuple(int(v * .6) for v in color)
    for cell in tf_cells(n, style):
        cx = (PAD + (cell % 5) * CELL + CELL / 2) * s
        cy = (PAD + (cell // 5) * CELL + CELL / 2) * s
        r = 36 * s
        d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=color, outline=dark, width=4 * s)
    TF_DIR.mkdir(parents=True, exist_ok=True)
    img.resize((w, h), Image.LANCZOS).save(TF_DIR / f"tf_{n:02d}_{style}.png", optimize=True)


def tf_alt(n, style):
    cells = tf_cells(n, style)
    if style < 4:
        if n <= 5:
            return f"Ten frame: {n} dots in the top row, bottom row empty"
        return f"Ten frame: top row full, {n - 5} dots in the bottom row"
    rows = []
    for name, rng_ in (("top row", range(5)), ("bottom row", range(5, 10))):
        boxes = [str(c % 5 + 1) for c in cells if c in rng_]
        rows.append(f"{name} boxes {', '.join(boxes)}" if boxes else f"{name} empty")
    return "Ten frame with dots in the " + "; ".join(rows)


def tf_media(n, style):
    name = f"tf_{n:02d}_{style}"
    return {"image": f"../../image/kg3_math/ten_frame/{name}.png", "alt": tf_alt(n, style),
            "media": {"kind": "image", "path": f"questions/kg3/math/ten-frame/{name}.webp",
                      "alt": tf_alt(n, style), "source_path": f"../../image/kg3_math/ten_frame/{name}.png"}}


def ten_frame(rng):
    out = []
    for n in range(1, 11):
        for style in range(6):
            draw_ten_frame(n, style)
            colour = TF_COLORS[style][0]
            if style >= 4:
                exp = f"Count each dot one time: {count_list(n)}. There are <strong>{n}</strong> dots."
            elif n <= 5:
                exp = f"Count the top row: {count_list(n)}. There are <strong>{n}</strong> dots."
            elif n == 10:
                exp = "Both rows are full. 5 and 5 make <strong>10</strong>. A full ten frame is 10!"
            else:
                exp = (f"The top row is full &mdash; that is 5. Then count on: "
                       f"{', '.join(str(i) for i in range(6, n + 1))}. 5 and {n - 5} make <strong>{n}</strong>.")
            out.append(q("How many dots?", "How many dots?", num_items(rng, n, 1, 10), exp, **tf_media(n, style)))
            # Empty boxes: rows styles for 3..9 dots, scattered styles for 5..10 dots (10 -> zero empty).
            if (style < 4 and 3 <= n <= 9) or (style >= 4 and n >= 5):
                e = 10 - n
                exp = (f"A ten frame has 10 boxes. {n} boxes have dots, so <strong>{e}</strong> "
                       + ("boxes are empty." if e != 1 else "box is empty.")
                       + (f" Count the empty boxes: {count_list(e)}." if e else " Every box is full!"))
                out.append(q("How many boxes are <strong>empty</strong>?", "How many boxes are empty?",
                             num_items(rng, e, 0, 10), exp, **tf_media(n, style)))
    assert len(out) == BANK, len(out)
    rng.shuffle(out)
    return out


# ---------------------------------------------------------------- 2. same number
THINGS = ["🍎", "🐟", "⭐", "🚗", "🌸", "🐤", "🍓", "🎈", "🐞", "🍪", "⚽", "🦋", "🍌", "🐢", "🧁", "🌼"]


def group_choices(rng, target, e):
    others = rng.sample([n for n in range(1, 7) if n != target], 2)
    counts = [target] + others
    rng.shuffle(counts)
    return [emoji_item(e, n == target, n, group=True) for n in counts]


def same_as_group(rng):
    ref, e = rng.sample(THINGS, 2)
    n = rng.randint(1, 6)
    exp = (f"{ref * n} has {n}. {e * n} has {n} too. "
           f"Match them one to one &mdash; <strong>same number</strong>!")
    return q(f"Tap the group with the <strong>same</strong> number as these:<br>{scene(ref, n)}",
             "Tap the group with the same number as these", group_choices(rng, n, e), exp,
             layout="column", scene={"emoji": ref, "count": n})


def number_to_group(rng):
    e = rng.choice(THINGS)
    n = rng.randint(1, 6)
    exp = f"Count: {count_list(n)}. The group {e * n} has <strong>{n}</strong>."
    return q(f"Tap the group with <strong class=\"kg3-big-num\">{n}</strong>", f"Tap the group with {n}",
             group_choices(rng, n, e), exp, layout="column")


def same_number(rng):
    return collect(rng, [same_as_group, number_to_group], [60, 40])


# ---------------------------------------------------------------- 3. odd one out
CATEGORIES = {
    "fruits": ["🍎", "🍌", "🍇", "🍓", "🍊", "🍐", "🍉", "🍒", "🍍", "🥝"],
    "animals": ["🐶", "🐱", "🐰", "🐻", "🐼", "🦁", "🐮", "🐷", "🐸", "🐵"],
    "things that go": ["🚗", "🚌", "🚲", "🚂", "✈️", "🚀", "🚜", "🚑", "🚒", "🛵"],
    "clothes": ["👕", "👖", "👗", "🧦", "🧢", "👟", "🧤", "🧣"],
    "flowers": ["🌻", "🌷", "🌹", "🌸", "🌼"],
}
SINGULAR = {"fruits": "a fruit", "animals": "an animal", "things that go": "a thing that goes",
            "clothes": "clothing", "flowers": "a flower"}
SHAPES = {
    "circles": ("a circle", {"red": "🔴", "orange": "🟠", "yellow": "🟡", "green": "🟢", "blue": "🔵", "purple": "🟣", "brown": "🟤"}),
    "squares": ("a square", {"red": "🟥", "orange": "🟧", "yellow": "🟨", "green": "🟩", "blue": "🟦", "purple": "🟪", "brown": "🟫"}),
    "hearts": ("a heart", {"red": "❤️", "orange": "🧡", "yellow": "💛", "green": "💚", "blue": "💙", "purple": "💜"}),
}


def place_odd(rng, same, odd):
    tiles = [(e, False) for e in same]
    tiles.insert(rng.randint(0, 3), (odd, True))
    return tiles


def odd_category(rng):
    cat, other = rng.sample(list(CATEGORIES), 2)
    same = rng.sample(CATEGORIES[cat], 3)
    odd = rng.choice(CATEGORIES[other])
    tiles = place_odd(rng, same, odd)
    exp = f"{' '.join(same)} are all {cat}. {odd} is not {SINGULAR[cat]}, so <strong>{odd}</strong> does not belong."
    return q("Which one does <strong>not</strong> belong?", "Which one does not belong?",
             [emoji_item(e, c) for e, c in tiles], exp)


def odd_shape(rng):
    fam, other = rng.sample(list(SHAPES), 2)
    # Four different colours, so colour never singles one out: only the shape does.
    colours = rng.sample([c for c in SHAPES[fam][1] if c in SHAPES[other][1]], 4)
    same = [SHAPES[fam][1][c] for c in colours[:3]]
    odd = SHAPES[other][1][colours[3]]
    tiles = place_odd(rng, same, odd)
    exp = f"{' '.join(same)} are all {fam}. {odd} is {SHAPES[other][0]}, so <strong>{odd}</strong> does not belong."
    return q("Which shape does <strong>not</strong> belong?", "Which shape does not belong?",
             [emoji_item(e, c) for e, c in tiles], exp)


def odd_number(rng):
    # Four different things, so only the number can single one group out.
    things = rng.sample(THINGS, 4)
    n, m = rng.sample(range(1, 6), 2)
    counts = [n, n, n]
    odd = rng.randint(0, 3)
    counts.insert(odd, m)
    e = things[odd]
    exp = f"Three groups have {n}. {e * m} has {m}, so <strong>{e * m}</strong> is different."
    return q("Which group has a <strong>different</strong> number?", "Which group has a different number?",
             [emoji_item(t, i == odd, c, group=True) for i, (t, c) in enumerate(zip(things, counts))], exp)


def odd_one_out(rng):
    return collect(rng, [odd_category, odd_shape, odd_number], [50, 25, 25])


# ---------------------------------------------------------------- 4. heavy or light
HEAVY = {"🐘": "elephant", "🚗": "car", "🚚": "truck", "🦛": "hippo", "🐄": "cow", "🐻": "bear",
         "🚌": "bus", "🦏": "rhino", "🐋": "whale", "🚂": "train", "🏠": "house", "🐎": "horse",
         "🦒": "giraffe", "🚜": "tractor", "🛳️": "ship"}
MEDIUM = {"🐕": "dog", "🐈": "cat", "🪑": "chair", "🎃": "pumpkin", "🍉": "watermelon"}
LIGHT = {"🪶": "feather", "🍃": "leaf", "🎈": "balloon", "🦋": "butterfly", "🐜": "ant", "🐞": "ladybug",
         "✏️": "pencil", "🍓": "strawberry", "🔑": "key", "🌸": "flower", "🧦": "sock", "🥄": "spoon",
         "🐝": "bee", "🖍️": "crayon", "🍪": "cookie"}


def light_note(e):
    return " It is big but full of air!" if e == "🎈" else ""


def heavier_lighter(rng):
    h, l = rng.choice(list(HEAVY)), rng.choice(list(LIGHT))
    want_heavy = rng.random() < .5
    pair = [(h, want_heavy), (l, not want_heavy)]
    rng.shuffle(pair)
    word = "heavier" if want_heavy else "lighter"
    exp = (f"A {h} {HEAVY[h]} is very heavy. A {l} {LIGHT[l]} is very light.{light_note(l)} "
           f"⚖️ The {h} side goes down. The <strong>{word}</strong> one is <strong>{h if want_heavy else l}</strong>.")
    return q(f"Tap the <strong>{word}</strong> one", f"Tap the {word} one",
             [emoji_item(e, c) for e, c in pair], exp, layout="row")


def heaviest_lightest(rng):
    h, m, l = rng.choice(list(HEAVY)), rng.choice(list(MEDIUM)), rng.choice(list(LIGHT))
    want_heavy = rng.random() < .5
    target = h if want_heavy else l
    trio = [h, m, l]
    rng.shuffle(trio)
    word = "heaviest" if want_heavy else "lightest"
    exp = (f"From heavy to light: {h} {HEAVY[h]}, then {m} {MEDIUM[m]}, then {l} {LIGHT[l]}. "
           f"The <strong>{word}</strong> is <strong>{target}</strong>.")
    return q(f"Tap the <strong>{word}</strong> one", f"Tap the {word} one",
             [emoji_item(e, e == target) for e in trio], exp, layout="row")


def heavy_light(rng):
    return collect(rng, [heavier_lighter, heaviest_lightest], [80, 20])


# ---------------------------------------------------------------- 5. first, second, third
ANIMALS = ["🐢", "🐇", "🦊", "🐻", "🐼", "🐸", "🐵", "🐧", "🐤", "🐱", "🐶", "🐷", "🐮", "🦁", "🐯", "🐨"]
ORD = ["1st", "2nd", "3rd", "4th", "5th"]
ORD_WORD = ["first", "second", "third", "fourth", "fifth"]
START = "🏁 ➡️"


def line_count(line, upto):
    return ", ".join(f"{i + 1} {line[i]}" for i in range(upto + 1))


def who_is(rng):
    line = rng.sample(ANIMALS, rng.randint(3, 5))
    pos = rng.choice([0, 1, 2, len(line) - 1])
    is_last = pos == len(line) - 1
    word = "LAST" if is_last and (pos > 2 or rng.random() < .5) else ORD_WORD[pos].upper()
    if word == "LAST":
        exp = f"Start at 🏁 and count: {line_count(line, pos)}. The <strong>last</strong> one is at the end: <strong>{line[pos]}</strong>."
    else:
        exp = f"Start at 🏁 and count: {line_count(line, pos)}. The {ORD[pos]} ({ORD_WORD[pos]}) is <strong>{line[pos]}</strong>."
    return q(f"{START} Who is <strong>{word}</strong> in line?", f"{START} Who is {word} in line?",
             [emoji_item(e, i == pos) for i, e in enumerate(line)], exp, layout="row")


def what_place(rng):
    line = rng.sample(ANIMALS, rng.randint(4, 5))    # 4+ long, so 1st-3rd are never also "last"
    pos = rng.randint(0, 2)
    a = line[pos]
    exp = f"Start at 🏁 and count: {line_count(line, pos)}. {a} is <strong>{ORD[pos]}</strong> ({ORD_WORD[pos]})."
    items = [item(f'{ORD[i]}<small class="kg3-word">{ORD_WORD[i]}</small>', i == pos, {"text": ORD[i]})
             for i in range(3)]
    return q(f"<span class=\"kg3-line\">{START} {' '.join(line)}</span><br>What place is the {a} in?",
             f"{START} {' '.join(line)} &mdash; What place is the {a} in?", items, exp)


def ordinal(rng):
    return collect(rng, [who_is, what_place], [60, 40])


# ---------------------------------------------------------------- 6. fair share
KIDS = ["👧", "👦", "🧒"]
TREATS = ["🍪", "🍎", "🍓", "🍬", "🧁", "🍌", "🎈", "⭐", "🍩", "🥕"]


def share_each(rng):
    kids = rng.choice([2, 2, 3])
    each = rng.randint(1, 5 if kids == 2 else 3)
    t = rng.choice(TREATS)
    who = KIDS[:kids] if kids == 3 else rng.sample(KIDS, 2)
    total = each * kids
    deal = "<br>".join(f"{k} {t * each}" for k in who)
    exp = f"Give one each, again and again, until they are all gone:<br>{deal}<br>Each child gets <strong>{each}</strong>."
    return q(f"Share the {t} fairly with {' '.join(who)}.<br>{scene(t, total)}How many does each child get?",
             f"Share {total} {t} fairly with {' '.join(who)}. How many does each child get?",
             num_items(rng, each, 1, 6), exp, scene={"emoji": t, "count": total})


FAIR = ("👍 Fair", "👎 Not fair")


def is_fair(rng):
    t = rng.choice(TREATS)
    a, b = rng.sample(KIDS, 2)
    x = rng.randint(1, 5)
    y = x if rng.random() < .5 else rng.choice([n for n in range(1, 6) if n != x])
    fair = x == y
    exp = (f"Both have {x}. Same number, so it is <strong>fair</strong>." if fair else
           f"{a} has {x} and {b} has {y}. {max(x, y)} is more than {min(x, y)}, so it is <strong>not fair</strong>.")
    return q(f"Is this fair?<br><span class=\"kg3-share\">{a} {t * x}<br>{b} {t * y}</span>",
             f"Is this fair? {a} has {t * x} and {b} has {t * y}.",
             [item(FAIR[0], fair, {"text": FAIR[0]}), item(FAIR[1], not fair, {"text": FAIR[1]})], exp, layout="row")


def fair_share(rng):
    return collect(rng, [share_each, is_fair], [45, 55])


# ---------------------------------------------------------------- exercises
EXERCISES = [
    dict(file="kg3_math_ten_frame", slug="math-ten-frame", title="Ten Frame", icon="🔲", build=ten_frame,
         desc="Count dots in two rows of five", say="Count the dots. Tap the number.",
         example='<img src="../../image/kg3_math/ten_frame/tf_07_0.png" alt="Ten frame: top row full, 2 dots in the bottom row" class="kg3-intro-img">',
         tip="The top row has 5 boxes. Full top row = 5. 5 and 2 more make <strong>7</strong>."),
    dict(file="kg3_math_same_number", slug="math-same-number", title="Same Number", icon="🟰", build=same_number,
         desc="Find the group that matches", say="Find the group with the same number.",
         example='<span class="kg3-intro-row">🍎🍎🍎</span><span class="kg3-intro-row">🐟🐟🐟 ✔️</span>',
         tip="3 apples and 3 fish. One fish for each apple &mdash; <strong>same number</strong>!"),
    dict(file="kg3_math_odd_one_out", slug="math-odd-one-out", title="Odd One Out", icon="🧐", build=odd_one_out,
         desc="Which one does not belong?", say="Three are the same kind. Tap the one that is different.",
         example='<span class="kg3-intro-row">🍎 🍌 🍇 🚗</span>',
         tip="🍎 🍌 🍇 are fruits. 🚗 is not a fruit, so <strong>🚗</strong> does not belong."),
    dict(file="kg3_math_heavy_light", slug="math-heavy-light", title="Heavy or Light", icon="🪶", build=heavy_light,
         desc="Which one is heavier?", say="Think: which is heavy? Which is light?",
         example='<span class="kg3-intro-row">🐘 ⬇️ ⚖️ ⬆️ 🪶</span>',
         tip="An elephant is <strong>heavy</strong>. A feather is <strong>light</strong>. Heavy things go down on the scale."),
    dict(file="kg3_math_ordinal", slug="math-ordinal", title="First, Second, Third", icon="🥇", build=ordinal,
         desc="Who is first in line?", say="Start at the flag 🏁 and count.",
         example='<span class="kg3-intro-row">🏁 🐢 🐇 🦊</span><span class="kg3-intro-row kg3-intro-ord"><span>1st</span><span>2nd</span><span>3rd</span></span>',
         tip="🐢 is <strong>first</strong>, 🐇 is <strong>second</strong>, 🦊 is <strong>third</strong> &mdash; and last."),
    dict(file="kg3_math_fair_share", slug="math-fair-share", title="Fair Share", icon="🍪", build=fair_share,
         desc="Share so everyone gets the same", say="Fair means everyone gets the same.",
         example='<span class="kg3-intro-row">👧 🍪🍪</span><span class="kg3-intro-row">👦 🍪🍪</span>',
         tip="Give one each, again and again. Both have 2 &mdash; that is <strong>fair</strong> 👍."),
]


def js_question(x):
    parts = [f"question: {json.dumps(x['html'], ensure_ascii=False)}"]
    if x.get("layout"):
        parts.append(f"layout: \"{x['layout']}\"")
    if x.get("image"):
        parts.append(f"image: {json.dumps(x['image'])}, alt: {json.dumps(x['alt'], ensure_ascii=False)}")
    items = ", ".join(f"{{ label: {json.dumps(i['label'], ensure_ascii=False)}, correct: {'true' if i['correct'] else 'false'} }}"
                      for i in x["items"])
    parts.append(f"items: [{items}]")
    parts.append(f"explanation: {json.dumps(x['exp'], ensure_ascii=False)}")
    return "    { " + ", ".join(parts) + " },"


PAGE = """<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>{title}</title>
    <!-- Quiz shell + tap-select layer (tokens live in question.css) + KG-3 math extras -->
    <link rel="stylesheet" href="../../css/question.css" />
    <link rel="stylesheet" href="../../css/tap_select.css" />
    <link rel="stylesheet" href="../../css/kg3_math_extra.css" />
  </head>
  <body class="kg3-math-extra kg3-{short}">

    <!-- Sticky Header -->
    <div id="site-header-placeholder"></div>

    <!-- Quiz Content -->
    <main class="quiz-container kg3-intro-open">
      <!-- How-to-play card with a worked example; hidden once the child presses Start -->
      <section id="kg3-intro" class="kg3-intro" aria-labelledby="kg3-intro-title">
        <h2 id="kg3-intro-title"><span aria-hidden="true">{icon}</span> {title}</h2>
        <p class="kg3-intro-say">{say}</p>
        <div class="kg3-intro-example">{example}</div>
        <p class="kg3-intro-tip">{tip}</p>
        <button type="button" id="kg3-start-btn" class="kg3-start-btn">Let's play ▶</button>
      </section>

      <div class="question-section">
        <h3 id="question-text">Loading...</h3>
      </div>

      <!-- Tap-select tiles are rendered here by the engine -->
      <div id="tap-grid" class="tap-grid"></div>

      <div id="feedback" class="hidden" role="status"></div>
      <div id="explanation" class="hidden"></div>
      <button id="back-btn" class="hidden">Back</button>
      <button id="next-btn" class="hidden">Next</button>
    </main>

    <script>
      // {title}: tap-select match mode. Generated by scripts/gen_kg3_math_extra.py
      // (same data as {slug}.json). Bank of 100; the engine shows a fresh random 25.
      const questions = [
{rows}
      ];
    </script>

    <div id="site-footer-placeholder"></div>

    <!-- Tap-select engine (exposes window.initTapSelectQuiz) + intro/focus helper -->
    <script src="../../js/tap_select.js"></script>
    <script src="../../js/kg3_math_extra.js"></script>
    <script src="../../js/partials.js"></script>
    <script>
      window.addEventListener("DOMContentLoaded", () => kg3MathStart(questions));
    </script>
  </body>
</html>
"""


def export(ex, bank, stamp):
    qs = []
    for i, x in enumerate(bank, 1):
        choices = [{"id": f"c{j}", **it["choice"]} for j, it in enumerate(x["items"], 1)]
        options = {"mode": "match", "choices": choices}
        if x.get("scene"):
            options["scene"] = x["scene"]
        qs.append({
            "slug": f"q{i:03d}", "type": "tap_select", "prompt": x["prompt"], "options": options,
            "answer_key": {"correct": [c["id"] for c, it in zip(choices, x["items"]) if it["correct"]]},
            "explanation": x["exp"], "media": x.get("media"), "order_index": i,
        })
    return {"_source_file": ex["file"] + ".html", "_extracted_at": stamp, "slug": ex["slug"], "title": ex["title"],
            "level": "kg3", "subject": "math", "quiz_type": "tap_select", "questions_per_attempt": 25,
            "total_questions": len(qs), "shuffle": "question", "is_free": False, "order_index": 0, "questions": qs}


def check(ex, bank):
    assert len(bank) == BANK, (ex["file"], len(bank))
    for n, x in enumerate(bank, 1):
        tag = f"{ex['file']} q{n}"
        assert sum(i["correct"] for i in x["items"]) == 1, tag
        assert 2 <= len(x["items"]) <= 5, tag
        assert len({json.dumps(i["choice"], ensure_ascii=False) for i in x["items"]}) == len(x["items"]), tag
        assert len({i["label"] for i in x["items"]}) == len(x["items"]), tag
        assert "<" not in x["prompt"] and x["exp"], tag


def main():
    stamp = datetime.now(timezone.utc).isoformat(timespec="milliseconds").replace("+00:00", "Z")
    JSON_OUT.mkdir(parents=True, exist_ok=True)
    for k, ex in enumerate(EXERCISES):
        bank = ex["build"](random.Random(2026 + k))
        check(ex, bank)
        html = PAGE.format(title=ex["title"], short=ex["file"].replace("kg3_math_", "").replace("_", "-"),
                           icon=ex["icon"], say=ex["say"], example=ex["example"], tip=ex["tip"], slug=ex["slug"],
                           rows="\n".join(js_question(x) for x in bank))
        (PAGES / f"{ex['file']}.html").write_text(html, encoding="utf-8", newline="\n")
        data = export(ex, bank, stamp)
        (JSON_OUT / f"{ex['slug']}.json").write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
        print(f"{ex['file']}: {len(bank)} questions")


if __name__ == "__main__":
    main()
