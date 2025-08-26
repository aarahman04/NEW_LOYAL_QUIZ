// =====================
//   Audio Word Quiz JS
//   Works with:  <script> const questions = [...] </script>  placed before app.js
// =====================

// Use the questions from the HTML, even if declared with top-level `const`.
const RAW = (() => {
  try { if (typeof questions !== "undefined" && Array.isArray(questions)) return questions; } catch {}
  try { if (typeof QUIZ_DATA !== "undefined" && Array.isArray(QUIZ_DATA)) return QUIZ_DATA; } catch {}
  // Also accept globals set on window/globalThis (optional)
  if (globalThis && Array.isArray(globalThis.questions)) return globalThis.questions;
  if (globalThis && Array.isArray(globalThis.QUIZ_DATA)) return globalThis.QUIZ_DATA;
  return [];
})();

if (!Array.isArray(RAW) || RAW.length === 0) {
  alert("No questions found. Define `const questions = [...]` before app.js.");
}

// Prefer this specific voice (Windows / Edge / Chrome on Windows)
const PREFERRED_VOICE_NAME =
  "Microsoft Christopher Online (Natural) - English (United States)";

// Optional: lock the dropdown to this voice only
const LOCK_VOICE = false; // set to true if you want to force this voice & disable the select

// ---------- DOM ----------
const voiceSel = null;
const rateInput  = document.getElementById("rate");
const pitchInput = document.getElementById("pitch");
const playBtn    = document.getElementById("playBtn");
const optsDiv    = document.getElementById("options");
const fb         = document.getElementById("feedback");
const instrEl    = document.getElementById("instruction");
const imgEl      = document.getElementById("qimg");
const prevBtn    = document.getElementById("prevBtn");  // acts as Back
const nextBtn    = document.getElementById("nextBtn");
const indexSpan  = document.getElementById("index");
const totalSpan  = document.getElementById("total");

// ---- Voice preferences per browser ----
const VOICE_PREFS = {
  chrome: [
    "Google US English",
    "Google UK English Female",
    "Google UK English Male"
  ],
  edge: [
    "Microsoft Christopher Online (Natural) - English (United States)",
    "Microsoft Aria Online (Natural) - English (United States)"
  ],
  safari: ["Samantha", "Alex", "Victoria"],
  default: ["Google US English", "Samantha"]
};

function detectBrowser() {
  const ua = navigator.userAgent;
  if (ua.includes("Edg/")) return "edge";
  if (ua.includes("Chrome/") || ua.includes("CriOS/")) return "chrome";
  if (ua.includes("Firefox/")) return "firefox";
  if (/Safari/.test(ua) && !/Chrome|CriOS|Edg/.test(ua)) return "safari";
  return "default";
}

function chooseBestVoice(voices, desiredLang = "en-US", preferredName = "") {
  // 1) if a specific name is requested (e.g., from a dropdown), honor it
  if (preferredName) {
    const exact  = voices.find(v => v.name === preferredName);
    const starts = voices.find(v => v.name && v.name.startsWith(preferredName));
    if (exact || starts) return exact || starts;
  }

  // 2) browser-specific name preferences
  const prefs = [
    ...(VOICE_PREFS[detectBrowser()] || []),
    ...VOICE_PREFS.default
  ];
  for (const name of prefs) {
    const v = voices.find(v => v.name === name);
    if (v) return v;
  }

  // 3) heuristics: Google > Microsoft > any en-US > any en
  let v =
    voices.find(v => /Google/i.test(v.name) && v.lang?.startsWith("en")) ||
    voices.find(v => /Microsoft/i.test(v.name) && v.lang?.startsWith("en")) ||
    voices.find(v => v.lang === desiredLang) ||
    voices.find(v => v.lang?.startsWith("en")) ||
    voices[0];

  return v || null;
}

// ---------- State ----------
let QUESTIONS = normalizeInput(RAW);
let idx = 0;
let speaking = false;
let answeredThisQuestion = false;
let correctCount = 0;

// ---------- Init ----------
init();

function init() {
  totalSpan.textContent = QUESTIONS.length;

  // Controls
  playBtn.addEventListener("click", onPlayClick);

  // -------------------- Navigation --------------------
  nextBtn.addEventListener("click", loadNextQuestion);
  prevBtn.addEventListener("click", loadPreviousQuestion);

  // Load first
  loadQuestion(0);
}

// Build voice dropdown (prefers Microsoft Christopher; uses its lang)
function bindVoices() {
  clearSelect(voiceSel);
  if (!("speechSynthesis" in window)) {
    addOption(voiceSel, "", "No TTS in this browser");
    playBtn.disabled = true;
    setFeedback("Your browser does not support Text-to-Speech.", "bad");
    return;
  }

  // Try to select the preferred Microsoft Christopher voice
  const exact = sorted.find(v => v.name === PREFERRED_VOICE_NAME);
  // Some browsers append " (en-US)" to the name; try startsWith as fallback
  const starts = exact ? null : sorted.find(v => v.name.startsWith(PREFERRED_VOICE_NAME));

  if (exact || starts) {
    voiceSel.value = (exact || starts).name;
  } else {
    // Fallbacks if that voice isn't installed on this machine
    const prefer = [
      PREFERRED_VOICE_NAME,
      "Microsoft Aria Online (Natural) - English (United States)",
      "Google US English",
      "Samantha", "Victoria", "Daniel"
    ];
    const found = sorted.find(v => prefer.includes(v.name))
               || sorted.find(v => v.lang.startsWith("en"))
               || sorted[0];
    if (found) voiceSel.value = found.name;
  }

  // Optionally lock voice selection
  if (LOCK_VOICE) {
    voiceSel.disabled = true;
    voiceSel.style.opacity = 0.7;
  }
}

function addOption(sel, value, label) {
  const opt = document.createElement("option");
  opt.value = value;
  opt.textContent = label;
  sel.appendChild(opt);
}
function clearSelect(sel) { while (sel.firstChild) sel.removeChild(sel.firstChild); }

// ---------- Rendering ----------
function loadQuestion(i) {
  if (!QUESTIONS.length) return;
  idx = (typeof i === "number") ? (i + QUESTIONS.length) % QUESTIONS.length : idx;
  const q = QUESTIONS[idx];

  // Reset state for this question
  answeredThisQuestion = false;
  nextBtn.disabled = true;              // block Next until user answers
  nextBtn.classList.add("is-disabled");
  setFeedback("", "");

  // Text
  instrEl.textContent = q.question || "Listen and choose the correct word.";

  // Image (optional)
  if (q.image) {
    imgEl.src = q.image;
    imgEl.style.display = "";
  } else {
    imgEl.src = "";
    imgEl.style.display = "none";
  }

  // Options
  optsDiv.innerHTML = "";
  q.options.forEach(opt => {
    const b = document.createElement("button");
    b.textContent = String(opt);
    b.addEventListener("click", () => check(opt));
    optsDiv.appendChild(b);
  });

  // Progress
  indexSpan.textContent = idx + 1;
  totalSpan.textContent = QUESTIONS.length;
}

// ---------- Interactions ----------
function onPlayClick() {
  const q = QUESTIONS[idx];
  const preferredVoiceName = voiceSel?.value || PREFERRED_VOICE_NAME || "";

  // Use the selected voice's language if available; fallback to question/lang or en-US
  const allVoices = ("speechSynthesis" in window) ? speechSynthesis.getVoices() || [] : [];
  const selectedVoiceObj =
    allVoices.find(v => v.name === preferredVoiceName) ||
    allVoices.find(v => v.name.startsWith(PREFERRED_VOICE_NAME)); // handle "(en-US)" suffix name

  const lang  = selectedVoiceObj?.lang || q.lang || "en-US";
  const rate  = Number(q.rate ?? rateInput?.value ?? 1.0) || 1.0;
  const pitch = Number(q.pitch ?? pitchInput?.value ?? 1.0) || 1.0;

  speakText(q.voice, { lang, rate, pitch, preferredVoiceName });
}

function check(chosen) {
  if (answeredThisQuestion) return; // ignore extra clicks

  const q = QUESTIONS[idx];
  const chosenN  = norm(chosen);
  const correctN = norm(q.correct);

  const buttons = [...optsDiv.querySelectorAll("button")];
  buttons.forEach(b => {
    const labelN = norm(b.textContent);
    if (labelN === correctN) b.classList.add("correct");
    if (labelN === chosenN && chosenN !== correctN) b.classList.add("wrong");
    b.disabled = true;
  });

  const isRight = chosenN === correctN;
  if (isRight) {
    correctCount++;
    setFeedback("Well done ❤️", "good");
    addEmojiRain("❤️", 50);
  } else {
    setFeedback("Oops, try again 😢", "bad");
    addEmojiRain("😭", 50);
  }

  // Mark answered; enable Next (no auto-advance)
  answeredThisQuestion = true;
  nextBtn.disabled = false;
  nextBtn.classList.remove("is-disabled");
}

// -------------------- Navigation (like your snippet) --------------------
function loadNextQuestion() {
  // If you want to force answering before moving on, keep this guard:
  if (!answeredThisQuestion) {
    setFeedback("Please choose an option before proceeding.", "bad");
    return;
  }

  idx++;
  if (idx < QUESTIONS.length) {
    loadQuestion(idx);
  } else {
    showCompletionScreen();
  }
}

function loadPreviousQuestion() {
  if (idx > 0) {
    idx--;
    loadQuestion(idx);
  }
}

// ---------- TTS ----------
function speakText(text, { lang = "en-US", rate = 1.0, pitch = 1.0, preferredVoiceName = "" } = {}) {
  if (!("speechSynthesis" in window)) {
    setFeedback("Text-to-Speech not supported in this browser.", "bad");
    return;
  }
  const utter = String(text || "").trim();
  if (!utter) {
    setFeedback("No voice text provided for this question.", "bad");
    return;
  }
  try { speechSynthesis.cancel(); } catch {}

  const u = new SpeechSynthesisUtterance(utter);

  // Slightly slower = clearer for kids
  u.rate  = clamp(Number(rate)  || 0.95, 0.7, 1.2);
  u.pitch = clamp(Number(pitch) || 1.0,  0.5, 2.0);

  let voices = speechSynthesis.getVoices() || [];

  // If voices aren’t loaded yet (Chrome sometimes), wait once then speak
  if (!voices.length) {
    const once = () => {
      speechSynthesis.onvoiceschanged = null;
      speakText(text, { lang, rate: u.rate, pitch: u.pitch, preferredVoiceName });
    };
    speechSynthesis.onvoiceschanged = once;
    return;
  }

  const best = chooseBestVoice(voices, lang, preferredVoiceName);
  if (best) {
    u.voice = best;
    u.lang  = best.lang || lang;
  } else {
    u.lang  = lang;
  }

  speaking = true;
  u.onend = () => { speaking = false; };

  speechSynthesis.speak(u);
}


// ---------- Completion Screen ----------
function showCompletionScreen() {
  const total = QUESTIONS.length;

  // stop any ongoing TTS
  if ("speechSynthesis" in window) { try { speechSynthesis.cancel(); } catch {} }

  instrEl.innerHTML = `
    <div class="completion-message" style="text-align:center; padding:2rem;">
      <h2>🎉 Quiz Completed! 🎉</h2>
      <p style="font-size:1.4rem; margin:1rem 0;">
        Your Score: <strong>${correctCount} / ${total}</strong>
      </p>
      <button id="home-btn" class="btn-home">Home</button>
    </div>
  `;

  // Clear the rest
  optsDiv.innerHTML = "";
  setFeedback("", "");
  if (imgEl) { imgEl.src = ""; imgEl.style.display = "none"; }

  // Hide nav buttons
  if (prevBtn) prevBtn.style.display = "none";
  if (nextBtn) nextBtn.style.display = "none";

  // HIDE PLAY BUTTON & ITS ROW  👇
  if (playBtn) {
    playBtn.disabled = true;
    playBtn.style.display = "none";
  }
  const controlsRow = document.querySelector(".controls-row");
  if (controlsRow) controlsRow.style.display = "none";

  // Home button
  choices.innerHTML      = "";
      clearFeedback();
      explanation.textContent= "";
      explanation.classList.add("hidden");
      nextBtn.style.display  = "none";
      backBtn.style.display  = "none";

      document.getElementById("home-btn").addEventListener("click", () => {
        const headerHome =
          document.querySelector(".logo-link") ||
          document.querySelector(".site-header .logo a") ||
          document.querySelector('nav a[href$="index.html"]');
        const href = headerHome?.getAttribute("href") || (window.base || "/") + "index.html";
        location.href = href;
    });
  }




// ---------- Emoji Rain ----------
function addEmojiRain(emoji, count = 50) {
  let container = document.getElementById("emoji-rain");
  if (!container) {
    container = document.createElement("div");
    container.id = "emoji-rain";
    document.body.appendChild(container);
  }

  for (let i = 0; i < count; i++) {
    const drop = document.createElement("div");
    drop.className = "emoji-drop";
    drop.textContent = emoji;

    const leftPercent = 5 + Math.random() * 90;
    drop.style.left              = `${leftPercent}%`;
    drop.style.top               = `-10%`;
    drop.style.position          = "fixed";
    drop.style.fontSize          = "3rem";
    drop.style.pointerEvents     = "none";
    drop.style.animation         = "emoji-fall 3s linear forwards";
    drop.style.animationDuration = (2 + Math.random() * 3) + "s";
    drop.style.animationDelay    = (Math.random() * 0.8) + "s";

    container.appendChild(drop);
    drop.addEventListener("animationend", () => drop.remove());
  }

  setTimeout(() => {
    if (container && container.childElementCount === 0) container.remove();
  }, 6000);
}

// (Add this CSS in your stylesheet if not already present)
/*
#emoji-rain { position: fixed; inset: 0; pointer-events: none; z-index: 9999; }
.emoji-drop { will-change: transform, opacity; }
@keyframes emoji-fall {
  0%   { transform: translateY(-10vh) rotate(0deg);   opacity: 0; }
  10%  { opacity: 1; }
  100% { transform: translateY(110vh) rotate(360deg); opacity: 0; }
}
*/

// ---------- Helpers ----------
function setFeedback(msg, cls) {
  fb.textContent = msg || "";

  // Base class logic (keeps your .feedback, .good, .bad hooks)
  fb.className = "feedback" + (cls ? " " + cls : "");

  // Force center alignment + sizing
  fb.style.textAlign = "center";
  fb.style.fontSize  = "1.4rem";
  fb.style.marginTop = "1rem";

  // Explicit colors (in case stylesheet doesn't define .good/.bad)
  if (cls === "good") {
    fb.style.color = "green";
  } else if (cls === "bad") {
    fb.style.color = "red";
  } else {
    fb.style.color = ""; // default
  }
}

function clamp(x, lo, hi) { return Math.max(lo, Math.min(hi, x)); }
function norm(x) { return String(x ?? "").trim().toLowerCase(); }

function normalizeInput(arr) {
  return arr.map((raw) => {
    const q = { ...raw };
    if (!q.question) q.question = "Listen and choose the correct word.";
    if (!q.voice)    q.voice    = String(q.utterance ?? "").trim();
    if (!Array.isArray(q.options)) q.options = [];
    q.options = q.options.map(o => String(o));
    q.correct = String(q.correct ?? "").trim();
    if (!q.lang)  q.lang  = "en-US";
    if (q.rate == null)  q.rate  = 1.0;
    if (q.pitch == null) q.pitch = 1.0;

    // Safety: ensure the correct option exists in the list
    const hasCorrect = q.options.some(o => norm(o) === norm(q.correct));
    if (!hasCorrect && q.correct) q.options = [q.correct, ...q.options];

    return q;
  });
}

