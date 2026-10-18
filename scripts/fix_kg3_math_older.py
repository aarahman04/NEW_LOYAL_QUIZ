"""Fix content issues in four older KG-3 math banks and re-export their JSON.

  position  - draws the 16 inside/outside scene pictures (they were missing), one
              distinct animal + answer per picture; tidies "(middle)" wording.
  shapes    - replaces the 🔽/🔼 "button" emoji (drawn inside a square on most
              devices), keeps diamonds out of "square" questions, and makes every
              explanation name the actual answer.
  big_small - replaces exact duplicate questions; explanations say what to compare.
  more_less - replaces the one duplicate question.

Run from the repo root:  python scripts/fix_kg3_math_older.py [--check] [json-folder]
--check only verifies that the JSON export reproduces the existing files.
"""
import json
import random
import re
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
PAGES = ROOT / "question" / "KG-3_math"
ARGS = [a for a in sys.argv[1:] if not a.startswith("--")]
JSON_DIR = Path(ARGS[0]) if ARGS else Path(r"C:\Users\aarah\Downloads\update data\LOYAL MCQ_S DATA\kg3\math")
POS_IMG = ROOT / "image" / "kg3_math" / "position"
BANK_RE = re.compile(r"const questions = (\[[\s\S]*?\n\s*\]);")
EMOJI_FONT = r"C:\Windows\Fonts\seguiemj.ttf"
SIZES = {"3.6": "xl", "2.4": "lg", "1.4": "sm"}


# ---------------------------------------------------------------- load / save
def load(name):
    src = (PAGES / f"kg3_math_{name}.html").read_text(encoding="utf-8")
    js = BANK_RE.search(src).group(1)
    out = subprocess.run(["node", "-e", "const vm=require('vm');process.stdout.write(JSON.stringify(vm.runInNewContext(require('fs').readFileSync(0,'utf8'))))"],
                         input=js, capture_output=True, text=True, encoding="utf-8", check=True).stdout
    return src, json.loads(out)


def js_row(q):
    parts = [f"question: {json.dumps(q['question'], ensure_ascii=False)}"]
    if q.get("layout"):
        parts.append(f"layout: \"{q['layout']}\"")
    if q.get("image"):
        parts.append(f"image: {json.dumps(q['image'])}")
    if q.get("alt"):
        parts.append(f"alt: {json.dumps(q['alt'], ensure_ascii=False)}")
    items = ", ".join(f"{{ label: {json.dumps(i['label'], ensure_ascii=False)}, correct: {'true' if i['correct'] else 'false'} }}"
                      for i in q["items"])
    parts.append(f"items: [{items}]")
    parts.append(f"explanation: {json.dumps(q['explanation'], ensure_ascii=False)}")
    return "    { " + ", ".join(parts) + " },"


def save(name, src, bank):
    body = "[\n" + "\n".join(js_row(q) for q in bank) + "\n      ]"
    src = BANK_RE.sub(lambda m: f"const questions = {body};", src, count=1)
    (PAGES / f"kg3_math_{name}.html").write_text(src, encoding="utf-8", newline="\n")


# ---------------------------------------------------------------- JSON export (same rules as the existing files)
def graphemes(s):
    # Emoji in these banks are single code points, optionally followed by VS16.
    return re.findall(r".\uFE0F?", s)


def is_emoji(g):
    return ord(g[0]) >= 0x2190


def choice(label):
    m = re.fullmatch(r"<span style='font-size:([\d.]+)rem'>(.+)</span>", label)
    if m:
        return {"emoji": m.group(2), "size": SIZES[m.group(1)]}
    g = graphemes(label)
    if g and len(set(g)) == 1 and is_emoji(g[0]):
        return {"emoji": g[0], "count": len(g)}
    return {"text": label}


def media(path, alt):
    if not path:
        return None
    stem = Path(path).stem
    return {"kind": "image", "path": f"questions/kg3/math/position/{stem}.webp",
            "alt": alt or stem.replace("_", " ").capitalize(), "source_path": path}


def export(old, bank):
    qs = []
    for i, q in enumerate(bank, 1):
        choices = [{"id": f"c{j}", **choice(it["label"])} for j, it in enumerate(q["items"], 1)]
        qs.append({"slug": f"q{i:03d}", "type": "tap_select", "prompt": re.sub(r"<[^>]+>", "", q["question"]),
                   "options": {"mode": "match", "choices": choices},
                   "answer_key": {"correct": [c["id"] for c, it in zip(choices, q["items"]) if it["correct"]]},
                   "explanation": q["explanation"], "media": media(q.get("image"), q.get("alt")), "order_index": i})
    return {**old, "total_questions": len(qs), "questions": qs}


def json_path(name):
    return JSON_DIR / f"math-{name.replace('_', '-')}.json"


# ---------------------------------------------------------------- position
ANIMALS = {"🐱": "cat", "🐶": "dog", "🐭": "mouse", "🐰": "rabbit", "🐸": "frog", "🐥": "chick", "🐻": "bear", "🐼": "panda"}


def draw_box_scene(animal, inside, side, path):
    s = 2                                                   # draw at 2x, downsample
    W, H = 640 * s, 400 * s
    img = Image.new("RGB", (W, H), (240, 249, 255))
    d = ImageDraw.Draw(img)
    ground = 340 * s
    d.rectangle([0, ground, W, H], fill=(187, 222, 160))
    bx = (W // 2 - 120 * s) if inside else (130 * s if side == "right" else 330 * s)
    bw, top, rim = 240 * s, 150 * s, 190 * s                 # box left, width, flap top, rim line
    brown, dark, edge = (205, 150, 92), (150, 100, 55), (110, 70, 35)
    # flaps and the dark inside of the open box
    d.polygon([(bx, rim), (bx - 40 * s, top), (bx + 30 * s, top + 10 * s), (bx + 40 * s, rim)], fill=brown, outline=edge, width=4 * s)
    d.polygon([(bx + bw, rim), (bx + bw + 40 * s, top), (bx + bw - 30 * s, top + 10 * s), (bx + bw - 40 * s, rim)], fill=brown, outline=edge, width=4 * s)
    d.rectangle([bx, rim - 18 * s, bx + bw, rim], fill=dark, outline=edge, width=4 * s)
    font = ImageFont.truetype(EMOJI_FONT, 109 * s // 1)
    emo = Image.new("RGBA", (160 * s, 160 * s), (0, 0, 0, 0))
    ImageDraw.Draw(emo).text((10 * s, 10 * s), animal, font=font, embedded_color=True)
    emo = emo.resize((150 * s, 150 * s), Image.LANCZOS)
    if inside:
        img.paste(emo, (bx + bw // 2 - 75 * s, rim - 105 * s), emo)       # peeks out over the rim
    # front of the box covers the lower body when inside
    d.rectangle([bx, rim, bx + bw, ground], fill=brown, outline=edge, width=4 * s)
    d.line([bx + bw // 2, rim, bx + bw // 2, rim + 50 * s], fill=edge, width=4 * s)
    if not inside:
        ax = bx + bw + 40 * s if side == "right" else bx - 190 * s
        img.paste(emo, (ax, ground - 98 * s), emo)                       # sits on the grass beside the box
    POS_IMG.mkdir(parents=True, exist_ok=True)
    img.resize((W // s, H // s), Image.LANCZOS).save(path, optimize=True)


def fix_position(bank, rng):
    out = []
    for q in bank:
        if q.get("image"):
            continue                                        # rebuilt below
        q = dict(q)
        q["question"] = q["question"].replace("on the MIDDLE (middle)", "in the MIDDLE").replace("at the MIDDLE", "in the MIDDLE")
        q["explanation"] = (q["explanation"].replace("at the bottom (below)", "at the bottom").replace("at the top (above)", "at the top")
                            .replace("at the middle (middle)", "in the middle").replace("on the middle", "in the middle"))
        out.append(q)
    scenes = []
    for k, (animal, name) in enumerate(ANIMALS.items()):
        for inside in (True, False):
            word = "inside" if inside else "outside"
            side = "right" if k % 2 else "left"
            stem = f"{'in' if inside else 'out'}_box_{name}"
            draw_box_scene(animal, inside, side, POS_IMG / f"{stem}.png")
            alt = f"A {name} {'sitting inside an open box' if inside else f'sitting on the grass next to an empty box'}"
            how = ("Its body is in the box &mdash; only its head peeks out." if inside
                   else "The box is empty &mdash; it is on the grass next to the box.")
            scenes.append({"question": f"Is the {animal} inside or outside the box 📦?",
                           "image": f"../../image/kg3_math/position/{stem}.png", "alt": alt,
                           "items": [{"label": "inside", "correct": inside}, {"label": "outside", "correct": not inside}],
                           "explanation": f"Look at the picture: the {animal} is <strong>{word}</strong> the box. {how}"})
    rng.shuffle(scenes)
    # put the 16 scene questions back where the old ones were (end of the bank)
    return out + scenes


# ---------------------------------------------------------------- shapes
FAM = {
    "circle": ["🔴", "🟠", "🟡", "🟢", "🔵", "🟣", "⚫", "⚪"],
    "square": ["🟥", "🟧", "🟨", "🟩", "🟦", "🟪", "⬛", "⬜"],
    "triangle": ["🔺", "🔻"],
    "heart": ["❤️", "🧡", "💛", "💚", "💙", "💜"],
    "star": ["⭐", "🌟"],
    "diamond": ["🔶", "🔷", "♦️"],
}
HINT = {"circle": "It is round, with no corners.", "square": "It has 4 straight sides that are all the same.",
        "triangle": "It has 3 sides and 3 corners.", "heart": "It looks like a ❤️ love heart.",
        "star": "It has 5 points.", "diamond": "It stands on one corner, like a kite."}
FAMILY_OF = {e: f for f, es in FAM.items() for e in es}


def fix_shapes(bank, rng):
    out = []
    for q in bank:
        q = json.loads(json.dumps(q))
        target = re.search(r"(circle|square|triangle|heart|star|diamond)", q["question"]).group(1)
        labels = [{"🔽": "🔻", "🔼": "🔺"}.get(i["label"], i["label"]) for i in q["items"]]
        # a diamond is a square on its corner: keep diamonds out of square questions
        bad = {"square": "diamond"}.get(target)
        for j, lab in enumerate(labels):
            fam = FAMILY_OF[lab]
            if lab not in labels[:j] and fam != bad:
                continue
            spare = [e for e in FAM[fam] if e not in labels] if fam != bad else []
            if spare:                               # same shape, other look (e.g. 🔻 -> 🔺)
                labels[j] = spare[0]
            else:
                labels[j] = rng.choice([e for f, es in FAM.items() if f not in (target, bad) for e in es if e not in labels])
        # a third triangle cannot be told apart from the other two: swap it for a non-triangle
        tri = [j for j, lab in enumerate(labels) if FAMILY_OF[lab] == "triangle"]
        for j in tri[2:]:
            labels[j] = rng.choice([e for f, es in FAM.items() if f != "triangle" for e in es if e not in labels])
        for it, lab in zip(q["items"], labels):
            it["label"] = lab
            it["correct"] = FAMILY_OF[lab] == target
        right = [i["label"] for i in q["items"] if i["correct"]]
        if q["question"].startswith("Tap all"):
            if len(right) == 1:                     # only one left after the swap
                q["question"] = f"Tap the {target}"
            else:
                q["explanation"] = f"There are {len(right)} {target}s: {' '.join(right)}. {HINT[target].replace('It ', 'Each one ', 1)} Tap them all!"
        if not q["question"].startswith("Tap all"):
            q["explanation"] = f"{right[0]} is a {target}. {HINT[target]}"
        out.append(q)
    return out


# ---------------------------------------------------------------- big / small
def size_span(e, size):
    return f"<span style='font-size:{size}rem'>{e}</span>"


def bs_explain(word, e):
    if word in ("bigger", "smaller"):
        return f"Look at both {e}: one is big and one is small. The <strong>{word}</strong> one is the {'big' if word == 'bigger' else 'small'} {e}."
    return f"Look at all three {e}: small, middle and big. The <strong>{word}</strong> is the {'big' if word == 'biggest' else 'small'} one."


def bs_word(q):
    return re.search(r"(biggest|smallest|bigger|smaller)", q["question"]).group(1)


def bs_key(q):
    return q["question"] + json.dumps(q["items"], ensure_ascii=False)


def fix_big_small(bank, rng):
    emoji = sorted({re.sub(r"<[^>]+>", "", i["label"]) for q in bank for i in q["items"]})
    seen, out = set(), []
    for q in bank:
        if bs_key(q) in seen:
            while True:
                e = rng.choice(emoji)
                word = rng.choice(["bigger", "smaller", "biggest", "smallest"])
                sizes = ["1.4", "3.6"] if word in ("bigger", "smaller") else ["1.4", "2.4", "3.6"]
                rng.shuffle(sizes)
                want = "3.6" if word.startswith("big") else "1.4"
                q = {"question": f"Tap the {word} {e}", "layout": "row",
                     "items": [{"label": size_span(e, s), "correct": s == want} for s in sizes], "explanation": ""}
                if bs_key(q) not in seen:
                    break
        else:
            q = json.loads(json.dumps(q))
        seen.add(bs_key(q))
        q["explanation"] = bs_explain(bs_word(q), re.search(r"Tap the \w+ (.+)$", q["question"]).group(1))
        out.append(q)
    return out


# ---------------------------------------------------------------- more / fewer
def fix_more_less(bank, rng):
    seen, out = set(), []
    pool = sorted({re.search(r"(?:more|fewer) (.+)$", q["question"]).group(1) for q in bank})
    for q in bank:
        key = q["question"] + json.dumps(q["items"], ensure_ascii=False)
        while key in seen:
            e, word = rng.choice(pool), rng.choice(["more", "fewer"])
            a, b = rng.sample(range(1, 9), 2)
            win = max(a, b) if word == "more" else min(a, b)
            lose = b if win == a else a
            q = {"question": f"Tap the side with {word} {e}", "layout": "row",
                 "items": [{"label": e * a, "correct": a == win}, {"label": e * b, "correct": b == win}],
                 "explanation": f"{win} is {'more' if word == 'more' else 'fewer'} than {lose}, so tap the side with {win} {e}."}
            key = q["question"] + json.dumps(q["items"], ensure_ascii=False)
        seen.add(key)
        out.append(q)
    return out


# ---------------------------------------------------------------- main
FIXES = {"position": fix_position, "shapes": fix_shapes, "big_small": fix_big_small, "more_less": fix_more_less}


def main():
    check_only = "--check" in sys.argv
    stamp = datetime.now(timezone.utc).isoformat(timespec="milliseconds").replace("+00:00", "Z")
    for k, (name, fix) in enumerate(FIXES.items()):
        src, bank = load(name)
        old = json.loads(json_path(name).read_text(encoding="utf-8"))
        if check_only:
            same = export(old, bank)["questions"] == old["questions"]
            print(f"{name}: export reproduces existing JSON = {same}")
            continue
        new = fix(bank, random.Random(4100 + k))
        assert len(new) == 100, (name, len(new))
        if name == "position":
            src = src.replace("word tiles + a TODO scene image (see below)", "word tiles + a scene picture")
            # scoped extras: word tiles that don't split mid-word on phones, focus ring, reduced motion
            src = src.replace('<link rel="stylesheet" href="../../css/tap_select.css" />',
                              '<link rel="stylesheet" href="../../css/tap_select.css" />\n'
                              '    <link rel="stylesheet" href="../../css/kg3_math_extra.css" />')
            src = src.replace("<body>", '<body class="kg3-math-extra kg3-position">', 1)
        save(name, src, new)
        data = export(old, new)
        data["_extracted_at"] = stamp
        json_path(name).write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
        print(f"{name}: {len(new)} questions written")


if __name__ == "__main__":
    main()
