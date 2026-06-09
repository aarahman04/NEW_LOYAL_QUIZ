# -*- coding: utf-8 -*-
"""
Generate Class-1 General Knowledge question banks.

- Existing 20 mixed GK files (level1_gk_l1..l20): each gets a distinct 100-question
  selection drawn from a large curated mixed pool.
- 5 new single-topic GK files are created (Animals, Fruits & Vegetables, Colours,
  My Body, Days & Months), each with 100 topic questions.

All questions are simple, child-friendly MCQs with the same shape the site already
uses: {question, options, correct, explanation}, consumed by initMCQQuiz().
"""
import os, re, random

GK_DIR = os.path.join("question", "level_1_GK")

# ---------------------------------------------------------------------------
# helpers
# ---------------------------------------------------------------------------
def mcq(q, correct, pool, exp, rng, n=3):
    """Build a single MCQ. `pool` = plausible wrong answers (same category)."""
    distract = [p for p in dict.fromkeys(pool) if p != correct]
    rng.shuffle(distract)
    options = [correct] + distract[:n-1]
    if len(options) < 2:
        return None
    rng.shuffle(options)
    return dict(question=q, options=options, correct=correct, explanation=exp)

def dedup_by_text(items):
    seen, out = set(), []
    for q in items:
        if q is None: continue
        if q["question"] in seen: continue
        seen.add(q["question"]); out.append(q)
    return out

# ---------------------------------------------------------------------------
# DATA TABLES (kept factual & Class-1 appropriate)
# ---------------------------------------------------------------------------
# name, sound, baby, home, legs, covering
ANIMALS = [
    ("Dog","Bark","Puppy","Kennel",4,"Fur"),
    ("Cat","Meow","Kitten","House",4,"Fur"),
    ("Cow","Moo","Calf","Shed",4,"Hair"),
    ("Lion","Roar","Cub","Den",4,"Fur"),
    ("Tiger","Roar","Cub","Den",4,"Fur"),
    ("Duck","Quack","Duckling","Pond",2,"Feathers"),
    ("Hen","Cluck","Chick","Coop",2,"Feathers"),
    ("Horse","Neigh","Foal","Stable",4,"Hair"),
    ("Sheep","Baa","Lamb","Pen",4,"Wool"),
    ("Pig","Oink","Piglet","Sty",4,"Skin"),
    ("Goat","Bleat","Kid","Shed",4,"Hair"),
    ("Frog","Croak","Tadpole","Pond",4,"Skin"),
    ("Elephant","Trumpet","Calf","Jungle",4,"Skin"),
    ("Bee","Buzz",None,"Hive",6,None),
    ("Snake","Hiss",None,"Hole",0,"Scales"),
    ("Bird","Chirp","Chick","Nest",2,"Feathers"),
    ("Fish",None,None,"Water",0,"Scales"),
    ("Monkey",None,"Baby","Tree",4,"Fur"),
    ("Rabbit",None,"Kit","Burrow",4,"Fur"),
    ("Cock","Crow","Chick","Coop",2,"Feathers"),
]
WILD = {"Lion","Tiger","Elephant","Monkey","Snake","Bear","Zebra","Giraffe","Deer","Fox"}
FARM = {"Cow","Hen","Horse","Sheep","Pig","Goat","Duck","Cock"}
PETS = {"Dog","Cat","Rabbit"}
CAN_FLY = {"Bird","Bee","Duck","Parrot","Crow","Butterfly"}
WATER_ANIMALS = {"Fish","Frog","Duck"}
ALL_LEGS = [0, 2, 4, 6, 8]
ALL_COVER = ["Fur","Feathers","Scales","Wool","Skin","Hair"]
ALL_HOMES = ["Kennel","House","Shed","Den","Pond","Coop","Stable","Pen","Sty",
             "Jungle","Hive","Hole","Nest","Water","Tree","Burrow"]

# Fruits / Vegetables (school-context, unambiguous)
FRUITS = ["Apple","Banana","Mango","Orange","Grapes","Watermelon","Pineapple",
          "Papaya","Guava","Cherry","Pear","Peach","Strawberry"]
VEG = ["Carrot","Potato","Onion","Cabbage","Brinjal","Cauliflower","Spinach",
       "Pumpkin","Radish","Beans","Peas","Garlic"]
UNDERGROUND = ["Potato","Carrot","Onion","Radish","Garlic"]
FOOD_COLOR = {"Banana":"Yellow","Lemon":"Yellow","Apple":"Red","Cherry":"Red",
              "Strawberry":"Red","Carrot":"Orange","Orange":"Orange",
              "Pumpkin":"Orange","Spinach":"Green","Cabbage":"Green",
              "Peas":"Green","Mango":"Yellow","Brinjal":"Purple"}

# Colours of everyday things (canonical, child-friendly)
COLOR_OBJECTS = {
    "sky":"Blue","sea":"Blue","blueberry":"Blue",
    "grass":"Green","leaf":"Green","frog":"Green","parrot":"Green",
    "peas":"Green","mint leaf":"Green","lettuce":"Green",
    "sun":"Yellow","banana":"Yellow","lemon":"Yellow","sunflower":"Yellow",
    "corn":"Yellow","butter":"Yellow","chick":"Yellow",
    "apple":"Red","tomato":"Red","rose":"Red","blood":"Red","cherry":"Red",
    "strawberry":"Red","ladybird":"Red","fire truck":"Red",
    "snow":"White","milk":"White","cloud":"White","cotton":"White",
    "rice":"White","chalk":"White","swan":"White",
    "coal":"Black","crow":"Black","night sky":"Black","tyre":"Black","ant":"Black",
    "carrot":"Orange","orange":"Orange","pumpkin":"Orange","marigold":"Orange",
    "basketball":"Orange",
    "brinjal":"Purple","jamun":"Purple",
    "soil":"Brown","tree trunk":"Brown","chocolate":"Brown","bear":"Brown",
    "camel":"Brown","wood":"Brown",
    "flamingo":"Pink","cotton candy":"Pink","bubblegum":"Pink","piglet":"Pink",
}
ALL_COLORS = ["Red","Blue","Green","Yellow","White","Black","Orange","Purple","Brown","Pink"]

# Body
BODY_COUNT = {"eyes":2,"ears":2,"hands":2,"legs":2,"arms":2,"feet":2,
              "knees":2,"elbows":2,"cheeks":2,"eyebrows":2,"thumbs":2,"lips":2,
              "nose":1,"mouth":1,"head":1,"tongue":1,"neck":1,"chin":1,
              "fingers on one hand":5,"toes on one foot":5}
BODY_USE = {"see":"eyes","hear":"ears","smell":"nose","taste":"tongue",
            "walk":"legs","hold things":"hands","think":"brain","chew food":"teeth",
            "clap":"hands","kick a ball":"legs","talk":"mouth","write":"hands",
            "run":"legs","jump":"legs","catch a ball":"hands","throw":"hands",
            "draw":"hands","blink":"eyes","breathe":"nose","sing":"mouth",
            "watch TV":"eyes","listen to music":"ears","bite":"teeth"}
BODY_PARTS = ["eyes","ears","nose","tongue","legs","hands","brain","teeth","mouth","hair"]

# Calendar
DAYS = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"]
MONTHS = ["January","February","March","April","May","June","July","August",
          "September","October","November","December"]
WEEKEND = {"Saturday","Sunday"}

# Opposites
OPPOSITES = [("big","small"),("hot","cold"),("up","down"),("day","night"),
             ("fast","slow"),("happy","sad"),("open","shut"),("tall","short"),
             ("full","empty"),("wet","dry"),("clean","dirty"),("hard","soft"),
             ("dark","light"),("old","new"),("high","low"),("in","out"),
             ("good","bad"),("young","old"),("long","short"),("near","far"),
             ("first","last"),("more","less"),("yes","no"),("on","off")]

# Community helpers: helper -> what they do
HELPERS = {"doctor":"treats sick people","teacher":"teaches us in school",
           "farmer":"grows crops in the field","police officer":"keeps us safe",
           "postman":"delivers our letters","cook":"cooks food for us",
           "driver":"drives a vehicle","barber":"cuts our hair",
           "dentist":"takes care of our teeth","pilot":"flies an aeroplane",
           "carpenter":"makes things from wood","gardener":"takes care of plants",
           "tailor":"stitches our clothes","fireman":"puts out fires"}

# Transport by where it moves
TRANSPORT = {"Car":"road","Bus":"road","Bicycle":"road","Train":"track",
             "Truck":"road","Boat":"water","Ship":"water","Submarine":"water",
             "Aeroplane":"air","Helicopter":"air","Rocket":"air"}

SHAPES_SIDES = {"Triangle":3,"Square":4,"Rectangle":4,"Circle":0,"Pentagon":5}

# ---------------------------------------------------------------------------
# CATEGORY GENERATORS
# ---------------------------------------------------------------------------
def g_animals(rng):
    out = []
    names = [a[0] for a in ANIMALS]
    sounds = [a[1] for a in ANIMALS if a[1]]
    babies = [a[2] for a in ANIMALS if a[2]]
    for name, sound, baby, home, legs, cover in ANIMALS:
        if sound:
            out.append(mcq("Which animal makes the sound “%s”?" % sound,
                           name, names, "A %s makes the sound '%s'." % (name.lower(), sound.lower()), rng))
            out.append(mcq("What sound does a %s make?" % name.lower(),
                           sound, sounds, "A %s says '%s'." % (name.lower(), sound.lower()), rng))
        if baby:
            out.append(mcq("What is the baby of a %s called?" % name.lower(),
                           baby, babies, "A baby %s is called a %s." % (name.lower(), baby.lower()), rng))
        out.append(mcq("How many legs does a %s have?" % name.lower(),
                       str(legs), [str(x) for x in ALL_LEGS],
                       "A %s has %d legs." % (name.lower(), legs), rng))
        out.append(mcq("Where does a %s live?" % name.lower(),
                       home, ALL_HOMES, "A %s lives in a %s." % (name.lower(), home.lower()), rng))
        if cover:
            out.append(mcq("What is the body of a %s covered with?" % name.lower(),
                           cover, ALL_COVER, "A %s's body is covered with %s." % (name.lower(), cover.lower()), rng))
    # grouping questions
    fly = [n for n in names if n in CAN_FLY]
    nofly = [n for n in names if n not in CAN_FLY]
    for n in fly:
        out.append(mcq("Which of these animals can fly?", n, nofly,
                       "A %s can fly." % n.lower(), rng))
    water = [n for n in names if n in WATER_ANIMALS]
    land = [n for n in names if n not in WATER_ANIMALS]
    for n in water:
        out.append(mcq("Which of these animals lives in water?", n, land,
                       "A %s can live in water." % n.lower(), rng))
    wild = [n for n in names if n in WILD]
    tame = [n for n in names if n in (FARM | PETS)]
    for n in wild:
        out.append(mcq("Which of these is a wild animal?", n, tame,
                       "A %s is a wild animal." % n.lower(), rng))
    for n in [x for x in names if x in FARM]:
        out.append(mcq("Which of these is a farm animal?", n, list(WILD),
                       "A %s is a farm animal." % n.lower(), rng))
    for n in [x for x in names if x in PETS]:
        out.append(mcq("Which of these is a pet animal?", n, list(WILD),
                       "A %s is a pet we keep at home." % n.lower(), rng))
    return dedup_by_text(out)

def g_food(rng):
    out = []
    f_phr = ["Is a %s a fruit or a vegetable?", "A %s is a kind of ___.",
             "We call a %s a ___."]
    for f in FRUITS:
        for p in f_phr:
            out.append(mcq(p % f.lower(), "Fruit", ["Fruit","Vegetable","Animal"],
                           "A %s is a fruit." % f.lower(), rng))
    for v in VEG:
        for p in f_phr:
            out.append(mcq(p % v.lower(), "Vegetable", ["Fruit","Vegetable","Bird"],
                           "A %s is a vegetable." % v.lower(), rng))
    for item, col in FOOD_COLOR.items():
        out.append(mcq("What colour is a %s?" % item.lower(), col, ALL_COLORS,
                       "A %s is %s." % (item.lower(), col.lower()), rng))
    # item-specific (unique text) so they don't collapse
    for u in UNDERGROUND:
        out.append(mcq("Does a %s grow under the ground or on a tree?" % u.lower(),
                       "Under the ground", ["Under the ground","On a tree","In the sky"],
                       "A %s grows under the ground." % u.lower(), rng))
    for f in FRUITS:
        out.append(mcq("Which of these is a fruit — %s, %s or %s?"
                       % (f.lower(), rng.choice(VEG).lower(), rng.choice(VEG).lower()),
                       f, VEG, "A %s is a fruit." % f.lower(), rng))
    for v in VEG:
        out.append(mcq("Which of these is a vegetable — %s, %s or %s?"
                       % (v.lower(), rng.choice(FRUITS).lower(), rng.choice(FRUITS).lower()),
                       v, FRUITS, "A %s is a vegetable." % v.lower(), rng))
    return dedup_by_text(out)

def g_colors(rng):
    out = []
    phr = ["What colour is the %s?", "The %s is usually which colour?"]
    for obj, col in COLOR_OBJECTS.items():
        for p in phr:
            out.append(mcq(p % obj, col, ALL_COLORS,
                           "The %s is %s." % (obj, col.lower()), rng))
    # reverse: which thing is this colour
    bycol = {}
    for obj, col in COLOR_OBJECTS.items():
        bycol.setdefault(col, []).append(obj)
    for col, objs in bycol.items():
        others = [o for o in COLOR_OBJECTS if COLOR_OBJECTS[o] != col]
        for o in objs:
            out.append(mcq("Which of these is usually %s?" % col.lower(), o, others,
                           "The %s is %s." % (o, col.lower()), rng))
    return dedup_by_text(out)

def g_body(rng):
    out = []
    cnt_phr = ["How many %s do we have?", "Count them: how many %s do we have?",
               "A person has how many %s?"]
    for part, n in BODY_COUNT.items():
        for p in cnt_phr:
            out.append(mcq(p % part, str(n), ["1","2","4","5","10"],
                           "We have %d %s." % (n, part), rng))
    use_phr = ["Which body part do we use to %s?", "We use our ___ to %s."]
    for act, part in BODY_USE.items():
        for p in use_phr:
            out.append(mcq(p % act, part, BODY_PARTS,
                           "We use our %s to %s." % (part, act), rng))
    # reverse: what is the main job of each part
    rev = {"eyes":"see","ears":"hear","nose":"smell","tongue":"taste","legs":"walk",
           "hands":"hold things","brain":"think","teeth":"chew food","mouth":"talk"}
    for part, act in rev.items():
        out.append(mcq("What is the main job of our %s?" % part, act,
                       list(BODY_USE.keys()), "We use our %s to %s." % (part, act), rng))
    return dedup_by_text(out)

def g_calendar(rng):
    out = []
    day_after = ["Which day comes after %s?", "What is the day right after %s?"]
    day_before = ["Which day comes before %s?", "What is the day just before %s?"]
    for i, d in enumerate(DAYS):
        nxt = DAYS[(i+1) % 7]; prv = DAYS[(i-1) % 7]
        for p in day_after:
            out.append(mcq(p % d, nxt, DAYS, "After %s comes %s." % (d, nxt), rng))
        for p in day_before:
            out.append(mcq(p % d, prv, DAYS, "Before %s comes %s." % (d, prv), rng))
    mon_after = ["Which month comes after %s?", "What is the month right after %s?"]
    mon_before = ["Which month comes before %s?", "What is the month just before %s?"]
    for i, m in enumerate(MONTHS):
        nxt = MONTHS[(i+1) % 12]; prv = MONTHS[(i-1) % 12]
        for p in mon_after:
            out.append(mcq(p % m, nxt, MONTHS, "After %s comes %s." % (m, nxt), rng))
        for p in mon_before:
            out.append(mcq(p % m, prv, MONTHS, "Before %s comes %s." % (m, prv), rng))
    # "between" questions (naturally unique text)
    for i in range(7):
        a, mid, b = DAYS[i], DAYS[(i+1) % 7], DAYS[(i+2) % 7]
        out.append(mcq("Which day comes between %s and %s?" % (a, b), mid, DAYS,
                       "%s comes between %s and %s." % (mid, a, b), rng))
    for i in range(12):
        a, mid, b = MONTHS[i], MONTHS[(i+1) % 12], MONTHS[(i+2) % 12]
        out.append(mcq("Which month comes between %s and %s?" % (a, b), mid, MONTHS,
                       "%s comes between %s and %s." % (mid, a, b), rng))
    out.append(mcq("How many days are there in a week?", "7", ["5","6","7","12"],
                   "There are 7 days in a week.", rng))
    out.append(mcq("How many months are there in a year?", "12", ["7","10","12","30"],
                   "There are 12 months in a year.", rng))
    out.append(mcq("Which is the first month of the year?", "January", MONTHS,
                   "January is the first month of the year.", rng))
    out.append(mcq("Which is the last month of the year?", "December", MONTHS,
                   "December is the last month of the year.", rng))
    weekdays = [d for d in DAYS if d not in WEEKEND]
    for w in WEEKEND:
        out.append(mcq("Which of these is a weekend day?", w, weekdays,
                       "%s is a weekend day." % w, rng))
    return dedup_by_text(out)

def g_opposites(rng):
    out = []
    words = [w for pair in OPPOSITES for w in pair]
    for a, b in OPPOSITES:
        out.append(mcq("What is the opposite of '%s'?" % a, b, words,
                       "The opposite of %s is %s." % (a, b), rng))
        out.append(mcq("What is the opposite of '%s'?" % b, a, words,
                       "The opposite of %s is %s." % (b, a), rng))
    return dedup_by_text(out)

def g_helpers(rng):
    out = []
    names = list(HELPERS.keys())
    for h, role in HELPERS.items():
        out.append(mcq("Who %s?" % role, h, names,
                       "A %s %s." % (h, role), rng))
        out.append(mcq("What does a %s do?" % h, role, list(HELPERS.values()),
                       "A %s %s." % (h, role), rng))
    return dedup_by_text(out)

def g_transport(rng):
    out = []
    names = list(TRANSPORT.keys())
    where = {"road":"on the road","track":"on a track","water":"on water","air":"in the air"}
    for veh, place in TRANSPORT.items():
        out.append(mcq("Where does a %s move?" % veh.lower(), where[place],
                       list(where.values()), "A %s moves %s." % (veh.lower(), where[place]), rng))
    for place, desc in where.items():
        matches = [v for v in names if TRANSPORT[v] == place]
        others = [v for v in names if TRANSPORT[v] != place]
        for v in matches:
            out.append(mcq("Which of these moves %s?" % desc, v, others,
                           "A %s moves %s." % (v.lower(), desc), rng))
    return dedup_by_text(out)

def g_shapes(rng):
    out = []
    names = list(SHAPES_SIDES.keys())
    for sh, k in SHAPES_SIDES.items():
        if k > 0:
            out.append(mcq("How many sides does a %s have?" % sh.lower(), str(k),
                           ["0","3","4","5","6"], "A %s has %d sides." % (sh.lower(), k), rng))
    out.append(mcq("Which shape is round?", "Circle", names,
                   "A circle is round and has no corners.", rng))
    out.append(mcq("Which shape looks like a ball?", "Circle", names,
                   "A ball looks like a circle.", rng))
    out.append(mcq("Which shape has 3 sides?", "Triangle", names,
                   "A triangle has 3 sides.", rng))
    out.append(mcq("Which shape looks like a door?", "Rectangle", names,
                   "A door looks like a rectangle.", rng))
    return dedup_by_text(out)

def g_nature(rng):
    out = []
    out.append(mcq("What do we see in the sky during the day?", "Sun",
                   ["Sun","Moon","Stars"], "We see the Sun in the day.", rng))
    out.append(mcq("What do we see in the sky at night?", "Moon",
                   ["Sun","Moon","Rainbow"], "We see the Moon at night.", rng))
    out.append(mcq("What twinkles in the sky at night?", "Stars",
                   ["Stars","Sun","Grass"], "Stars twinkle at night.", rng))
    out.append(mcq("What falls from the clouds as rain?", "Water",
                   ["Water","Sand","Milk"], "Rain is water from the clouds.", rng))
    out.append(mcq("Which season is very hot?", "Summer",
                   ["Summer","Winter","Rainy"], "Summer is the hot season.", rng))
    out.append(mcq("Which season is very cold?", "Winter",
                   ["Summer","Winter","Spring"], "Winter is the cold season.", rng))
    out.append(mcq("What do we use to stay dry in the rain?", "Umbrella",
                   ["Umbrella","Fan","Spoon"], "We use an umbrella in the rain.", rng))
    out.append(mcq("The Sun gives us light and ___.", "heat",
                   ["heat","ice","rain"], "The Sun gives us light and heat.", rng))
    out.append(mcq("What do plants need to grow?", "Water",
                   ["Water","Plastic","Glass"], "Plants need water, air and sunlight.", rng))
    out.append(mcq("Which gives us light during the day?", "Sun",
                   ["Sun","Moon","Lamp"], "The Sun gives light in the day.", rng))
    out.append(mcq("Water turns into ice when it is very ___.", "cold",
                   ["cold","hot","dry"], "Water freezes into ice when very cold.", rng))
    out.append(mcq("Which of these is a colour of the rainbow?", "Red",
                   ["Red","Black","Brown"], "Red is a colour of the rainbow.", rng))
    return dedup_by_text(out)

def g_manners(rng):
    out = []
    out.append(mcq("What do we say when someone helps us?", "Thank you",
                   ["Thank you","Go away","Be quiet"], "We say 'Thank you'.", rng))
    out.append(mcq("What do we say when we want something politely?", "Please",
                   ["Please","No","Stop"], "We say 'Please' to be polite.", rng))
    out.append(mcq("What do we say when we make a mistake?", "Sorry",
                   ["Sorry","Hurray","Hello"], "We say 'Sorry' when we are wrong.", rng))
    out.append(mcq("We should wash our hands before ___.", "eating",
                   ["eating","sleeping at noon","playing in mud"], "Wash hands before eating.", rng))
    out.append(mcq("We brush our teeth to keep them ___.", "clean",
                   ["clean","dirty","broken"], "Brushing keeps teeth clean.", rng))
    out.append(mcq("How many times a day should we brush our teeth?", "2",
                   ["0","1","2"], "We should brush twice a day.", rng))
    out.append(mcq("What should we do with garbage?", "Put it in the bin",
                   ["Put it in the bin","Throw it on the road","Hide it"], "Put garbage in the bin.", rng))
    out.append(mcq("Before crossing the road we should ___.", "look both ways",
                   ["look both ways","close our eyes","run fast"], "Always look both ways.", rng))
    out.append(mcq("We should drink ___ water to stay healthy.", "clean",
                   ["clean","dirty","muddy"], "Drink clean water.", rng))
    out.append(mcq("What do we say when we meet someone?", "Hello",
                   ["Hello","Goodbye","Sorry"], "We greet by saying 'Hello'.", rng))
    return dedup_by_text(out)

def g_misc(rng):
    out = []
    out.append(mcq("Which of these floats on water?", "Boat",
                   ["Boat","Stone","Iron nail"], "A boat floats on water.", rng))
    out.append(mcq("Which of these sinks in water?", "Stone",
                   ["Stone","Leaf","Paper"], "A heavy stone sinks.", rng))
    out.append(mcq("Which of these is a living thing?", "Dog",
                   ["Dog","Chair","Stone"], "A dog is a living thing.", rng))
    out.append(mcq("Which of these is a non-living thing?", "Table",
                   ["Table","Cat","Plant"], "A table is non-living.", rng))
    out.append(mcq("Which of these is hot?", "Fire",
                   ["Fire","Ice","Snow"], "Fire is hot.", rng))
    out.append(mcq("Which of these is cold?", "Ice",
                   ["Ice","Fire","Sun"], "Ice is cold.", rng))
    out.append(mcq("Which of these is soft?", "Pillow",
                   ["Pillow","Rock","Brick"], "A pillow is soft.", rng))
    out.append(mcq("Which of these is hard?", "Stone",
                   ["Stone","Cotton","Sponge"], "A stone is hard.", rng))
    out.append(mcq("What do we use to write on paper?", "Pencil",
                   ["Pencil","Spoon","Shoe"], "We write with a pencil.", rng))
    out.append(mcq("What do we use to cut paper?", "Scissors",
                   ["Scissors","Cup","Pillow"], "We cut paper with scissors.", rng))
    out.append(mcq("Where do we go to learn?", "School",
                   ["School","Hospital","Market"], "We learn at school.", rng))
    out.append(mcq("Where do we go when we are sick?", "Hospital",
                   ["Hospital","Park","Zoo"], "We go to a hospital when sick.", rng))
    out.append(mcq("Which animal is known as the King of the Jungle?", "Lion",
                   ["Lion","Cat","Rabbit"], "The lion is the King of the Jungle.", rng))
    out.append(mcq("What do we use to see in the dark?", "Torch",
                   ["Torch","Pillow","Plate"], "A torch helps us see in the dark.", rng))
    out.append(mcq("What do bees make?", "Honey",
                   ["Honey","Milk","Bread"], "Bees make honey.", rng))
    out.append(mcq("What do we get from a cow?", "Milk",
                   ["Milk","Honey","Wool"], "We get milk from a cow.", rng))
    out.append(mcq("What do we get from a sheep?", "Wool",
                   ["Wool","Milk","Eggs"], "We get wool from a sheep.", rng))
    out.append(mcq("What do we get from a hen?", "Eggs",
                   ["Eggs","Wool","Honey"], "We get eggs from a hen.", rng))
    return dedup_by_text(out)

# ---------------------------------------------------------------------------
# build banks
# ---------------------------------------------------------------------------
def build_union(seed=12345):
    rng = random.Random(seed)
    pool = []
    for g in (g_animals, g_food, g_colors, g_body, g_calendar, g_opposites,
              g_helpers, g_transport, g_shapes, g_nature, g_manners, g_misc):
        pool += g(rng)
    pool = dedup_by_text(pool)
    return pool

def serialize(items):
    def js(s):
        return '"' + str(s).replace("\\", "\\\\").replace('"', '\\"') + '"'
    lines = []
    for q in items:
        opts = "[" + ", ".join(js(o) for o in q["options"]) + "]"
        lines.append("        { question: %s, options: %s, correct: %s, explanation: %s }"
                     % (js(q["question"]), opts, js(q["correct"]), js(q["explanation"])))
    return "[\n" + ",\n".join(lines) + "\n      ]"

def replace_array(text, arr_text):
    m = re.search(r"const\s+questions\s*=\s*", text)
    i = text.index("[", m.end())
    depth, j = 0, i
    while j < len(text):
        if text[j] == "[": depth += 1
        elif text[j] == "]":
            depth -= 1
            if depth == 0: break
        j += 1
    return text[:i] + arr_text + text[j+1:]

NEW_TEMPLATE = """<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
    <title>__TITLE__</title>
    <link rel="stylesheet" href="../../css/question.css" />
  </head>

  <body>

    <!-- Sticky Header -->
    <div id="site-header-placeholder"></div>

    <!-- Quiz Content -->
    <main class="quiz-container">
      <div class="question-section">
        <h3 id="question-text">Loading...</h3>
        <ul class="options" id="options-list"></ul>
      </div>

      <div id="feedback" class="hidden"></div>
      <div id="explanation" class="hidden"></div>

      <button id="back-btn" class="hidden" onclick="loadPreviousQuestion()">Back</button>
      <button id="next-btn" class="hidden" onclick="loadNextQuestion()">Next</button>
    </main>

    <!-- Questions -->
    <script>
      const questions = __ARRAY__;
    </script>

    <!-- Footer -->
    <div id="site-footer-placeholder"></div>

    <!-- JS -->
    <script src="../../js/script.js"></script>
    <script src="../../js/partials.js"></script>
    <script>
      window.addEventListener("DOMContentLoaded", () => {
        initMCQQuiz(questions);
      });
    </script>

  </body>
</html>
"""

def assert_bank(items, label):
    assert len(items) >= 100, "%s only %d" % (label, len(items))
    for q in items[:100]:
        assert q["correct"] in q["options"], (label, q)
        assert len(set(q["options"])) == len(q["options"]), (label, q)
    texts = [q["question"] for q in items[:100]]
    assert len(set(texts)) == 100, "%s has duplicate texts" % label

def main():
    union = build_union()
    print("Union pool size: %d distinct questions" % len(union))
    assert len(union) >= 100

    # 1) existing 20 mixed files -> distinct 100 each
    for n in range(1, 21):
        fn = os.path.join(GK_DIR, "level1_gk_l%d.html" % n)
        rng = random.Random(1000 + n)
        sel = union[:]; rng.shuffle(sel); sel = sel[:100]
        assert_bank(sel, fn)
        text = open(fn, encoding="utf-8").read()
        open(fn, "w", encoding="utf-8").write(replace_array(text, serialize(sel)))
        print("  mixed  level1_gk_l%-2d -> 100" % n)

    # 2) five new single-topic files
    topics = [
        ("level1_gk_animals.html",     "GK – Animals",            g_animals),
        ("level1_gk_fruits_veg.html",  "GK – Fruits & Vegetables", g_food),
        ("level1_gk_colours.html",     "GK – Colours",            g_colors),
        ("level1_gk_my_body.html",     "GK – My Body",            g_body),
        ("level1_gk_days_months.html", "GK – Days & Months",      g_calendar),
    ]
    for i, (fname, title, gen) in enumerate(topics):
        rng = random.Random(5000 + i)
        items = gen(rng); rng.shuffle(items); items = items[:100]
        assert_bank(items, fname)
        html = NEW_TEMPLATE.replace("__TITLE__", title).replace("__ARRAY__", serialize(items))
        open(os.path.join(GK_DIR, fname), "w", encoding="utf-8").write(html)
        print("  topic  %-26s -> 100" % fname)

    print("Done.")

if __name__ == "__main__":
    main()
