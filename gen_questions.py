# -*- coding: utf-8 -*-
"""
Generate exactly 100 topic-aligned MCQ questions for each Level 1 Maths file
and rewrite the `const questions = [ ... ];` array in place.

Preserves the existing object shape ({question, options, correct, explanation}
plus optional `image`), option counts, phrasing style and the initMCQQuiz call.
"""
import os, re, json, random

DIR = os.path.join("question", "Level 1 Maths")
NL_IMAGE = "../../image/level_1_math/number_line_1_to_50.jpg"

ONES = ["Zero","One","Two","Three","Four","Five","Six","Seven","Eight","Nine"]
TEENS = ["Ten","Eleven","Twelve","Thirteen","Fourteen","Fifteen","Sixteen",
         "Seventeen","Eighteen","Nineteen"]
TENS = ["","","Twenty","Thirty","Forty","Fifty","Sixty","Seventy","Eighty","Ninety"]

def num2words(n):
    if n < 10: return ONES[n]
    if n < 20: return TEENS[n-10]
    if n < 100:
        t, o = divmod(n, 10)
        return TENS[t] + ("" if o == 0 else "-" + ONES[o].lower())
    if n == 100: return "One hundred"
    return str(n)

def blk(s):
    """wrap a value in the project's black-span styling"""
    return "<span style='color:black;'>%s</span>" % s

def take100(items):
    assert len(items) >= 100, "only %d generated" % len(items)
    return items[:100]

def opts(correct, distractors, rng):
    o = [correct] + distractors
    rng.shuffle(o)
    return o

def int_distractors(correct, k, lo, hi, rng, pool=None):
    cand = pool if pool else list(range(lo, hi+1))
    cand = [c for c in cand if c != correct and lo <= c <= hi]
    rng.shuffle(cand)
    # prefer near values for plausibility
    near = sorted(cand, key=lambda x: abs(x-correct))
    chosen, seen = [], set()
    for c in near:
        if c not in seen:
            chosen.append(c); seen.add(c)
        if len(chosen) == k: break
    while len(chosen) < k:                      # last resort
        v = correct + len(chosen) + 1
        if v not in seen and v != correct:
            chosen.append(v); seen.add(v)
    rng.shuffle(chosen)
    return chosen

# ----------------------------------------------------------------------------
# Topic generators -- each returns a list of >=100 dicts
# ----------------------------------------------------------------------------
def gen_addition(cap, rng):
    phr = ["What is {a} + {b}?", "{a} + {b} = ?", "Add: {a} + {b}",
           "How much is {a} + {b}?", "Find the sum: {a} + {b}"]
    pairs = [(a, b) for s in range(1, cap+1) for a in range(0, s+1) for b in [s-a]]
    rng.shuffle(pairs)
    out, seen, pi = [], set(), 0
    while len(out) < 100:
        for (a, b) in pairs:
            text = phr[pi % len(phr)].format(a=a, b=b)
            if text in seen: continue
            seen.add(text)
            c = a + b
            d = int_distractors(c, 1, 0, cap+2, rng)[0]
            out.append(dict(question=text, options=opts(str(c), [str(d)], rng),
                            correct=str(c), explanation="%d + %d = %d" % (a, b, c)))
            if len(out) >= 100: break
        pi += 1
    return out

def gen_doubles(cap, rng):
    # gentle progression: the named cap is the starting point; numbers grow
    # just enough to yield 100 distinct doubles items (brief allows this).
    vmax = max(cap, 17)
    phr = ["Add the doubles: <br> %s" % blk("{a} + {a}"),
           "Double of {a} is?", "{a} + {a} = ?",
           "What is double {a}?", "Twice {a} is?",
           "Two groups of {a} — how many in all?"]
    out, seen, pi = [], set(), 0
    while len(out) < 100 and pi < len(phr):
        for a in range(1, vmax+1):
            text = phr[pi].format(a=a)
            if text in seen: continue
            seen.add(text)
            c = 2*a
            d = int_distractors(c, 1, 0, 2*vmax+2, rng, pool=[c-2, c-1, c+1, c+2, c+10])[0]
            out.append(dict(question=text, options=opts(str(c), [str(d)], rng),
                            correct=str(c), explanation="%d + %d = %d" % (a, a, c)))
            if len(out) >= 100: break
        pi += 1
    return out

def gen_subtraction(cap, rng):
    phr = ["What is {a} − {b}?", "{a} − {b} = ?", "Subtract: {a} − {b}",
           "Take away {b} from {a}. What is left?", "How much is {a} − {b}?"]
    pairs = [(a, b) for a in range(0, cap+1) for b in range(0, a+1)]
    rng.shuffle(pairs)
    out, seen, pi = [], set(), 0
    while len(out) < 100:
        for (a, b) in pairs:
            text = phr[pi % len(phr)].format(a=a, b=b)
            if text in seen: continue
            seen.add(text)
            c = a - b
            d = int_distractors(c, 1, 0, cap, rng, pool=[c-2, c-1, c+1, c+2])[0]
            out.append(dict(question=text, options=opts(str(c), [str(d)], rng),
                            correct=str(c), explanation="%d − %d = %d" % (a, b, c)))
            if len(out) >= 100: break
        pi += 1
    return out

def gen_convert(cap, rng):
    vmax = max(cap, 21)                          # gentle progression to reach 100
    phr = ["Convert the given number in words: <br> %s",
           "Write the number in words: <br> %s",
           "How do you write this number in words? <br> %s",
           "Choose the correct word for: <br> %s",
           "Which word shows this number? <br> %s"]
    out, seen, pi = [], set(), 0
    while len(out) < 100 and pi < len(phr):
        for n in range(0, vmax+1):
            text = phr[pi] % blk(n)
            if text in seen: continue
            seen.add(text)
            c = num2words(n)
            dn = int_distractors(n, 1, 0, vmax, rng, pool=[n-2, n-1, n+1, n+2])[0]
            out.append(dict(question=text, options=opts(c, [num2words(dn)], rng),
                            correct=c, explanation="%d = %s" % (n, c)))
            if len(out) >= 100: break
        pi += 1
    return out

def gen_reading(cap, rng):
    vmax = max(cap, 21)                          # gentle progression to reach 100
    phr = ["Read the numbers in words. Choose the correct numeral. <br> %s",
           "Which numeral matches this word? <br> %s",
           "Choose the correct number for: <br> %s",
           "Read the word and pick the numeral. <br> %s",
           "Which number is this word? <br> %s"]
    out, seen, pi = [], set(), 0
    while len(out) < 100 and pi < len(phr):
        for n in range(0, vmax+1):
            text = phr[pi] % blk(num2words(n))
            if text in seen: continue
            seen.add(text)
            dn = int_distractors(n, 1, 0, vmax, rng, pool=[n-2, n-1, n+1, n+2])[0]
            out.append(dict(question=text, options=opts(str(n), [str(dn)], rng),
                            correct=str(n), explanation="%s = %d" % (num2words(n), n)))
            if len(out) >= 100: break
        pi += 1
    return out

def gen_counting(rng):
    nouns = [("\U0001F34E","apples"),("⭐","stars"),("\U0001F41F","fish"),
             ("\U0001F338","flowers"),("\U0001F697","cars"),("\U0001F388","balloons"),
             ("\U0001F34C","bananas"),("\U0001F41D","bees"),("⚽","balls"),
             ("\U0001F36A","cookies")]
    out = []
    for emoji, noun in nouns:
        for n in range(1, 11):
            d = n + (1 if n < 10 else -1)
            if d == n: d = n - 2
            correct = emoji * n
            distract = emoji * d
            text = "Which group shows <strong>%d</strong> %s?" % (n, noun)
            o = [correct, distract]; rng.shuffle(o)
            out.append(dict(question=text, options=o, correct=correct,
                            explanation="%s shows %d %s." % (correct, n, noun)))
    rng.shuffle(out)
    return out

def gen_number_line(cap, rng):
    cands = []
    after_phr = ["What comes after %d?", "Which number comes right after %d?",
                 "Find the number just after %d on the number line."]
    before_phr = ["What comes before %d?", "Which number comes just before %d?",
                  "Find the number right before %d on the number line."]
    for x in range(1, cap):
        for ph in after_phr:
            cands.append((ph % x, x+1, "On the number line, after %d comes %d." % (x, x+1)))
    for x in range(2, cap+1):
        for ph in before_phr:
            cands.append((ph % x, x-1, "On the number line, before %d comes %d." % (x, x-1)))
    for x in range(1, cap-1):
        cands.append(("What number is between %d and %d?" % (x, x+2), x+1,
                      "%d sits between %d and %d on the number line." % (x+1, x, x+2)))
    for x in range(1, cap):
        cands.append(("What is 1 more than %d?" % x, x+1,
                      "1 more than %d is %d." % (x, x+1)))
    for x in range(2, cap+1):
        cands.append(("What is 1 less than %d?" % x, x-1,
                      "1 less than %d is %d." % (x, x-1)))
    rng.shuffle(cands)
    res, seen = [], set()
    for text, c, exp in cands:
        if text in seen: continue
        seen.add(text)
        d = int_distractors(c, 1, 0, cap+1, rng, pool=[c-1, c+1, c-2, c+2])[0]
        res.append(dict(question=text, image=NL_IMAGE,
                        options=opts(str(c), [str(d)], rng),
                        correct=str(c), explanation=exp))
    return res

def gen_odd_even(cap, rng):
    phr = ["Identify whether the number is Odd or Even. <br> %s",
           "Is this number Odd or Even? <br> %s",
           "Choose Odd or Even for: <br> %s",
           "Tell whether the number is Odd or Even. <br> %s",
           "Odd or Even? <br> %s"]
    out, seen, pi = [], set(), 0
    while len(out) < 100 and pi < len(phr):
        for n in range(1, cap+1):
            text = phr[pi] % blk(n)
            if text in seen: continue
            seen.add(text)
            c = "Even" if n % 2 == 0 else "Odd"
            o = ["Odd", "Even"]; rng.shuffle(o)
            out.append(dict(question=text, options=o, correct=c,
                            explanation="%d is %s." % (n, c.lower())))
            if len(out) >= 100: break
        pi += 1
    return out

def gen_place_value(rng):
    out, seen = [], set()
    for n in range(10, 100):
        s = str(n)
        for pos in (0, 1):                      # tens digit, ones digit
            digit = s[pos]
            under = "".join(("<span style='text-decoration:underline;'>%s</span>" % ch)
                            if i == pos else ch for i, ch in enumerate(s))
            key = (n, pos)
            if key in seen: continue
            seen.add(key)
            c = "Tens" if pos == 0 else "Ones"
            place = "tens" if pos == 0 else "ones"
            o = ["Ones", "Tens"]; rng.shuffle(o)
            text = "Identify the place value of the underlined digit. <br> %s" % blk(under)
            out.append(dict(question=text, options=o, correct=c,
                            explanation="The underlined %s is in the %s place." % (digit, place)))
    rng.shuffle(out)
    return out

def gen_number_bonds(total, rng):
    # number bonds are taught with many part-part-whole representations
    def forms(a, t):
        return [
            "Pick the number that makes %d.<br>%s" % (t, blk("%d + __ = %d" % (a, t))),
            "What goes in the blank?<br>%s" % blk("%d + __ = %d" % (a, t)),
            "Pick the number that makes %d.<br>%s" % (t, blk("__ + %d = %d" % (a, t))),
            "Which number completes the bond?<br>%s" % blk("%d + __ = %d" % (a, t)),
            "Complete the number bond.<br>%s" % blk("%d = %d + __" % (t, a)),
            "How many more do we add to %d to make %d?" % (a, t),
            "%d and which number make %d?" % (a, t),
            "Find the missing part of %d.<br>%s" % (t, blk("%d + __ = %d" % (a, t))),
            "Fill the blank to make %d.<br>%s" % (t, blk("__ + %d = %d" % (a, t))),
            "%d is made of %d and which number?" % (t, a),
        ]
    out, seen, pi = [], set(), 0
    nforms = len(forms(0, total))
    while len(out) < 100 and pi < nforms:
        for a in range(0, total+1):
            text = forms(a, total)[pi]
            if text in seen: continue
            seen.add(text)
            c = total - a
            d = int_distractors(c, 1, 0, total, rng, pool=[c-1, c+1, c-2, c+2])[0]
            out.append(dict(question=text, options=opts(str(c), [str(d)], rng),
                            correct=str(c), explanation="%d + %d = %d." % (a, c, total)))
            if len(out) >= 100: break
        pi += 1
    return out

def gen_compare(rng):
    out, seen = [], set()
    while len(out) < 140:
        a = rng.randint(0, 20); b = rng.randint(0, 20)
        if rng.random() < 0.2: b = a              # ensure some equals
        if (a, b) in seen: continue
        seen.add((a, b))
        if a > b: c, exp = ">", "%d is greater than %d." % (a, b)
        elif a < b: c, exp = "<", "%d is less than %d." % (a, b)
        else: c, exp = "=", "Both are equal."
        text = ("Pick the correct sign (>, <, =) to make the statement true.<br>%s"
                % blk("%d __ %d" % (a, b)))
        out.append(dict(question=text, options=[">", "<", "="], correct=c, explanation=exp))
    return out

def gen_missing_number(cap, rng):
    one_phr = ["Choose the number that completes the sequence.<br>%s",
               "What number is missing?<br>%s",
               "Fill in the missing number.<br>%s"]
    cands = []
    # count by 1s, 4-term windows, blank in any position
    for s in range(0, cap-2):
        seqfull = [s, s+1, s+2, s+3]
        if seqfull[-1] > cap: continue
        for pos in range(4):
            disp = ", ".join("__" if i == pos else str(v) for i, v in enumerate(seqfull))
            c = seqfull[pos]
            for ph in one_phr:
                cands.append((ph % blk(disp), c,
                              "Counting by 1s: the missing number is %d." % c))
    # count by 2s
    for s in range(0, cap-5, 2):
        seqfull = [s, s+2, s+4, s+6]
        if seqfull[-1] > cap: continue
        for pos in (1, 2):
            disp = ", ".join("__" if i == pos else str(v) for i, v in enumerate(seqfull))
            c = seqfull[pos]
            cands.append(("Count by 2s to fill the blank.<br>%s" % blk(disp), c,
                          "Counting by 2s: the missing number is %d." % c))
    rng.shuffle(cands)
    out, seen = [], set()
    for text, c, exp in cands:
        if text in seen: continue
        seen.add(text)
        d = int_distractors(c, 1, 0, cap, rng, pool=[c-1, c+1, c-2, c+2])[0]
        out.append(dict(question=text, options=opts(str(c), [str(d)], rng),
                        correct=str(c), explanation=exp))
    return out

def gen_before_after(rng):
    out = []
    for n in range(1, 51):
        out.append(("What number comes <strong>AFTER</strong> %s?" % blk(n), n+1,
                    "The number after %d is %d." % (n, n+1)))
    for n in range(1, 51):
        out.append(("What number comes <strong>BEFORE</strong> %s?" % blk(n), n-1,
                    "The number before %d is %d." % (n, n-1)))
    rng.shuffle(out)
    res = []
    for text, c, exp in out:
        d = int_distractors(c, 2, 0, 52, rng, pool=[c-2, c-1, c+1, c+2, c+3])
        res.append(dict(question=text, options=opts(str(c), [str(x) for x in d], rng),
                        correct=str(c), explanation=exp))
    return res

def gen_shapes(rng):
    sides = {"Triangle":3,"Square":4,"Rectangle":4,"Pentagon":5,"Hexagon":6,
             "Circle":0,"Oval":0,"Diamond":4,"Star":5}
    realworld = {"Circle":"a wheel","Square":"a chess board","Triangle":"a slice of pizza",
                 "Rectangle":"a door","Star":"a twinkling star in the sky",
                 "Diamond":"a kite","Oval":"an egg"}
    shapes = list(sides.keys())
    out, seen = [], set()
    def add(text, correct, distract, exp):
        if text in seen: return
        seen.add(text)
        o = [correct] + distract; rng.shuffle(o)
        out.append(dict(question=text, options=o, correct=correct, explanation=exp))
    # how many sides
    for sh, k in sides.items():
        if k == 0: continue
        text = "How many sides does a <strong>%s</strong> have?" % sh
        ds = [str(x) for x in int_distractors(k, 2, 1, 8, rng)]
        add(text, str(k), ds, "A %s has %d sides." % (sh, k))
    # how many corners
    for sh, k in sides.items():
        text = "How many corners does a <strong>%s</strong> have?" % sh
        corners = 0 if k == 0 else k
        ds = [str(x) for x in int_distractors(corners, 2, 0, 8, rng)]
        add(text, str(corners), ds,
            "A %s has %d corners." % (sh, corners))
    # which shape has k sides
    for k in (3, 4, 5, 6):
        match = [s for s in shapes if sides[s] == k]
        if not match: continue
        correct = match[0]
        wrong = [s for s in shapes if sides[s] != k]
        rng.shuffle(wrong)
        add("Which shape has <strong>%d sides</strong>?" % k, correct, wrong[:2],
            "A %s has %d sides and %d corners." % (correct, k, k))
    # round / no corners
    add("Which shape is round and has <strong>no corners</strong>?", "Circle",
        ["Square", "Triangle"], "A Circle is round and has no corners.")
    # real world
    for sh, rw in realworld.items():
        wrong = [s for s in shapes if s != sh]; rng.shuffle(wrong)
        add("Which shape looks like <strong>%s</strong>?" % rw, sh, wrong[:2],
            "%s looks like %s." % (rw.capitalize(), sh))
    # identify by description of sides
    for sh, k in sides.items():
        if k == 0: continue
        wrong = [s for s in shapes if s != sh]; rng.shuffle(wrong)
        add("Which shape has <strong>%d equal-looking corners</strong>?" % k
            if sh in ("Square","Triangle","Pentagon","Hexagon") else
            "Which shape has exactly <strong>%d sides and %d corners</strong>?" % (k, k),
            sh, wrong[:2], "A %s has %d sides and %d corners." % (sh, k, k))
    # comparisons to reach plenty
    pairs = [("Triangle","Square","fewer sides","Triangle"),
             ("Square","Triangle","more sides","Square"),
             ("Pentagon","Square","more sides","Pentagon"),
             ("Hexagon","Pentagon","more sides","Hexagon"),
             ("Square","Pentagon","fewer sides","Square")]
    for a, b, rel, ans in pairs:
        other = b if ans == a else a
        add("Which shape has <strong>%s</strong>: a %s or a %s?" % (rel, a, b),
            ans, [other, "Circle"],
            "A %s has %s than a %s." % (ans, rel, other))
    # guaranteed fillers: distinct phrasings of side/corner counts per shape
    side_phr = ["Count the sides: how many sides does a <strong>%s</strong> have?",
                "How many straight sides does a <strong>%s</strong> have?",
                "A <strong>%s</strong> — how many sides does it have?",
                "Tell the number of sides of a <strong>%s</strong>."]
    corner_phr = ["Count the corners of a <strong>%s</strong>. How many are there?",
                  "How many corners (vertices) does a <strong>%s</strong> have?",
                  "A <strong>%s</strong> — how many corners does it have?",
                  "Tell the number of corners of a <strong>%s</strong>."]
    for ph in side_phr:
        for sh in shapes:
            k = sides[sh]
            add(ph % sh, str(k), [str(x) for x in int_distractors(k, 2, 0, 8, rng)],
                "A %s has %d sides." % (sh, k))
            if len(out) >= 100: break
        if len(out) >= 100: break
    for ph in corner_phr:
        for sh in shapes:
            k = sides[sh]
            add(ph % sh, str(k), [str(x) for x in int_distractors(k, 2, 0, 8, rng)],
                "A %s has %d corners." % (sh, k))
            if len(out) >= 100: break
        if len(out) >= 100: break
    rng.shuffle(out)
    return out

def gen_ascending(rng):
    out, seen = [], set()
    while len(out) < 130:
        nums = rng.sample(range(1, 51), 3)
        asc = sorted(nums); desc = sorted(nums, reverse=True)
        ascending = rng.random() < 0.5
        key = (tuple(nums), ascending)
        if key in seen: continue
        seen.add(key)
        if ascending:
            correct = ", ".join(map(str, asc))
            wrongs = [", ".join(map(str, desc)),
                      ", ".join(map(str, [nums[0], nums[2], nums[1]]))]
            text = ("Which shows the numbers %s in ascending (small to big) order?"
                    % ", ".join(map(str, nums)))
            exp = "Ascending means smallest to biggest: %s." % correct
        else:
            correct = ", ".join(map(str, desc))
            wrongs = [", ".join(map(str, asc)),
                      ", ".join(map(str, [nums[1], nums[0], nums[2]]))]
            text = ("Which shows the numbers %s in descending (big to small) order?"
                    % ", ".join(map(str, nums)))
            exp = "Descending means biggest to smallest: %s." % correct
        wrongs = [w for w in dict.fromkeys(wrongs) if w != correct][:2]
        guard = 0
        while len(wrongs) < 2 and guard < 50:
            guard += 1
            cand = ", ".join(map(str, rng.sample(nums, 3)))
            if cand != correct and cand not in wrongs:
                wrongs.append(cand)
        if len(wrongs) < 2:
            continue
        o = [correct] + wrongs; rng.shuffle(o)
        out.append(dict(question=text, options=o, correct=correct, explanation=exp))
    return out

def gen_word_problems(cap, rng):
    names = ["Ali","Sara","Omar","Lina","Sami","Maya","Adam","Noor","Zaid","Hana",
             "Yusuf","Rana","Karim","Dina","Tariq","Lara"]
    objs = [("apples","more"),("balloons","more"),("pencils","more"),("stickers","more"),
            ("candies","more"),("books","more"),("marbles","more"),("oranges","more"),
            ("toy cars","more"),("cookies","more"),("flowers","more"),("crayons","more")]
    # loss phrasings that read naturally for any countable object
    away = ["are given away","are lost","are shared with friends",
            "are used up","go missing","are taken away"]
    out, seen = [], set()
    tries = 0
    while len(out) < 100 and tries < 20000:
        tries += 1
        name = rng.choice(names)
        obj, _ = rng.choice(objs)
        kind = rng.choice(["add", "sub", "both"])
        # keep every count >= 2 so plural nouns/verbs always agree
        if kind == "add":
            if cap < 4: continue
            a = rng.randint(2, cap-2); b = rng.randint(2, cap-a)
            c = a + b
            text = "%s has %d %s. %s gets %d more %s. How many %s now?" % (
                name, a, obj, name, b, obj, obj)
            exp = "%d + %d = %d %s." % (a, b, c, obj)
        elif kind == "sub":
            a = rng.randint(4, cap); b = rng.randint(2, a-2); c = a - b
            verb = rng.choice(away)
            text = "%s has %d %s. %d %s %s. How many %s are left?" % (
                name, a, obj, b, obj, verb, obj)
            exp = "%d − %d = %d %s left." % (a, b, c, obj)
        else:
            if cap < 4: continue
            a = rng.randint(2, cap-2); b = rng.randint(2, cap-a)
            obj2, _ = rng.choice(objs)
            c = a + b
            text = "%s has %d %s and %d %s. How many things does %s have altogether?" % (
                name, a, obj, b, obj2, name)
            exp = "%d + %d = %d altogether." % (a, b, c)
        if text in seen: continue
        seen.add(text)
        ds = [str(x) for x in int_distractors(c, 2, 0, cap+3, rng, pool=[c-2, c-1, c+1, c+2, c+3])]
        o = [str(c)] + ds; rng.shuffle(o)
        out.append(dict(question=text, options=o, correct=str(c), explanation=exp))
    return out

# ----------------------------------------------------------------------------
# filename -> generator
# ----------------------------------------------------------------------------
def build(fname, rng):
    f = fname.lower()
    def cap_after(key):
        m = re.search(key + r"_(\d+)", f)
        return int(m.group(1)) if m else None
    if "adding_doubles_till" in f:
        return gen_doubles(cap_after("till"), rng)
    if "addition_upto" in f:
        return gen_addition(cap_after("upto"), rng)
    if "subtraction_till" in f:
        return gen_subtraction(cap_after("till"), rng)
    if "convert_numbers_till" in f:
        return gen_convert(cap_after("till"), rng)
    if "reading_numbers_till" in f:
        return gen_reading(cap_after("till"), rng)
    if "counting_objects" in f:
        return gen_counting(rng)
    if "number_line_upto" in f:
        return gen_number_line(cap_after("upto"), rng)
    if "odd_even_till" in f:
        return gen_odd_even(cap_after("till"), rng)
    if "place_value" in f:
        return gen_place_value(rng)
    if "number_bonds_to" in f:
        return gen_number_bonds(cap_after("to"), rng)
    if "compare_numbers" in f:
        return gen_compare(rng)
    if "missing_number_0_to" in f:
        return gen_missing_number(cap_after("to"), rng)
    if "before_and_after" in f:
        return gen_before_after(rng)
    if "shape_recognition" in f:
        return gen_shapes(rng)
    if "ascending_and_descending" in f:
        return gen_ascending(rng)
    if "word_problems_till" in f:
        return gen_word_problems(cap_after("till"), rng)
    return None

# ----------------------------------------------------------------------------
# serialization + in-place array replacement
# ----------------------------------------------------------------------------
def js_str(s):
    # double-quoted JS string; project HTML uses single quotes internally
    return '"' + s.replace("\\", "\\\\").replace('"', '\\"') + '"'

def serialize(items):
    lines = []
    for q in items:
        parts = ["question: " + js_str(q["question"])]
        if "image" in q:
            parts.append("image: " + js_str(q["image"]))
        parts.append("options: [" + ", ".join(js_str(o) for o in q["options"]) + "]")
        parts.append("correct: " + js_str(q["correct"]))
        parts.append("explanation: " + js_str(q["explanation"]))
        lines.append("    { " + ", ".join(parts) + " }")
    return "[\n" + ",\n".join(lines) + "\n  ]"

def replace_array(text):
    m = re.search(r"const\s+questions\s*=\s*", text)
    if not m: return None
    i = text.index("[", m.end())
    depth, j = 0, i
    while j < len(text):
        ch = text[j]
        if ch == "[": depth += 1
        elif ch == "]":
            depth -= 1
            if depth == 0: break
        j += 1
    return (i, j+1)   # span of the [...] inclusive

def main():
    files = sorted(os.listdir(DIR))
    report = []
    for fn in files:
        if not fn.endswith(".html"): continue
        path = os.path.join(DIR, fn)
        with open(path, "r", encoding="utf-8") as fh:
            text = fh.read()
        items = build(fn, rng=random.Random(hash(fn) & 0xffffffff))
        if items is None:
            report.append((fn, "SKIP (no generator)", "-")); continue
        items = take100(items)
        # integrity: correct must be one of options; options distinct
        for q in items:
            assert q["correct"] in q["options"], (fn, q)
            assert len(set(q["options"])) == len(q["options"]), (fn, q)
        span = replace_array(text)
        if not span:
            report.append((fn, "NO ARRAY FOUND", "-")); continue
        i, j = span
        new_text = text[:i] + serialize(items) + text[j:]
        with open(path, "w", encoding="utf-8") as fh:
            fh.write(new_text)
        report.append((fn, "OK", str(len(items))))
    print("%-58s %-18s %s" % ("FILE", "STATUS", "COUNT"))
    for r in report:
        print("%-58s %-18s %s" % r)
    oks = [r for r in report if r[1] == "OK"]
    print("\n%d files written, %d skipped" % (len(oks), len(report)-len(oks)))

if __name__ == "__main__":
    main()
