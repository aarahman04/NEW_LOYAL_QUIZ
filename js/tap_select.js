/* ============================================================
   tap_select.js — "Tap the right ones" interactive engine
   Exposes: window.initTapSelectQuiz(questions)

   A kid-friendly, tap-to-select quiz for young learners (KG /
   ~5 years). It is deliberately SUBJECT-AGNOSTIC so it can be
   reused across Math, Science, English and GK:

     • Math    — "Tap the 🔺 triangle", "Tap 4 apples 🍎",
                 "Tap the ball that is INSIDE the box"
     • Science — "Tap all the animals", "Tap the things that fly"
     • English — "Tap the words that start with B"
     • GK      — "Tap all the fruits"

   It follows the SAME 100-in-bank / 25-shown contract as the MCQ
   and audio engines: the full `questions` array is the source of
   truth and is never mutated; a fresh random 25 is drawn on open.

   Shared DOM contract (reused, not renamed):
     #question-text, #feedback, #explanation, #next-btn, #back-btn,
     .quiz-container
   Extra hook this engine fills:
     #tap-grid   — container the tappable tiles are rendered into.
   The engine also CREATES (if absent) a live tap counter and a
   Check button, so exercise pages only need a #tap-grid element.
   Styling lives in css/tap_select.css (loaded with question.css).

   ------------------------------------------------------------------
   Question shapes
   ------------------------------------------------------------------
   MATCH mode — tap the item(s) that fit a rule:
     {
       question: "Tap the 🔺 triangle",
       items: [
         { label: "🔺", correct: true },
         { label: "🟦", correct: false },
         { label: "⚫", correct: false }
       ],
       explanation: "A triangle has 3 sides."     // optional
     }
     • `items` may also be plain strings (treated as correct:false).
     • 1 correct item  → a single tap checks instantly (like MCQ).
     • >1 correct items → tap several, then press the Check button.

   COUNT mode — tap a given NUMBER of things:
     {
       question: "Tap 4 apples 🍎",
       count: 4,
       items: ["🍎","🍎","🍎","🍎","🍎","🍎"],
       explanation: "Count 1, 2, 3, 4 as you tap."  // optional
     }
     • Any `count` tiles are accepted; a live counter helps kids
       keep track as they tap.
   ============================================================ */

;(function () {
  "use strict";

  // How many questions to show per attempt (drawn from the full bank).
  const QUIZ_SIZE = 25;

  /* -------- 25-of-100 selection (copy-shuffle, never mutate) -------- */
  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }
  function pickSubset(bank, size) {
    const list = Array.isArray(bank) ? bank : [];
    return shuffle(list).slice(0, Math.min(size, list.length));
  }

  // Strip a stale leading list-marker ("1." / "12)" / "3 - x") from
  // question text — never touches math like "3 - 1".
  function stripLeadingNumber(text) {
    if (typeof text !== "string") return text;
    return text
      .replace(/^\s*\d{1,3}\s*[.):]\s+/, "")
      .replace(/^\s*\d{1,3}\s+-\s+(?=\D)/, "");
  }

  // Normalize each item to { label, correct }. Strings become tiles
  // that are correct:false (used as distractors / count fillers).
  function normalizeItems(items) {
    return (Array.isArray(items) ? items : []).map((it) => {
      if (it && typeof it === "object") {
        return { label: String(it.label ?? ""), correct: !!it.correct };
      }
      return { label: String(it), correct: false };
    });
  }

  /* -------- Self-contained emoji rain (reuses question.css hooks) ----
     Uses #emoji-rain / .emoji-drop + the `fall` keyframes defined in
     css/question.css, so no extra styling is required here. onDone
     fires once the celebration window elapses (unlocks Next). */
  function tapEmojiRain(emoji, count, onDone) {
    const done = typeof onDone === "function" ? onDone : function () {};
    const old = document.getElementById("emoji-rain");
    if (old) old.remove();

    const container = document.createElement("div");
    container.id = "emoji-rain";
    document.body.appendChild(container);

    let maxEnd = 0;
    for (let i = 0; i < count; i++) {
      const drop = document.createElement("div");
      drop.className = "emoji-drop";
      drop.textContent = emoji;
      const dur = 1.0 + Math.random() * 0.7;   // 1.0–1.7s
      const delay = Math.random() * 0.25;       // 0–0.25s
      maxEnd = Math.max(maxEnd, dur + delay);
      drop.style.left = `${5 + Math.random() * 80}%`;
      drop.style.fontSize = `${2.4 + Math.random() * 1.4}rem`;
      drop.style.animationDuration = `${dur}s`;
      drop.style.animationDelay = `${delay}s`;
      container.appendChild(drop);
      drop.addEventListener("animationend", () => drop.remove());
    }
    setTimeout(() => { container.remove(); done(); }, Math.round(maxEnd * 1000) + 60);
  }

  /* ============================================================
     Public init
     ============================================================ */
  window.initTapSelectQuiz = function initTapSelectQuiz(allQuestions) {
    // Draw a fresh random 25 from the full bank every time the page opens.
    const questions = pickSubset(allQuestions, QUIZ_SIZE);

    // --- State ---
    let current = 0;
    let correctCount = 0;
    let answered = false;
    let nextLocked = false;
    let target = 0;          // how many tiles should be tapped
    let countMode = false;
    let items = [];          // normalized items for the current question
    const selected = new Set();

    // --- Core elements (shared contract) ---
    const qText       = document.getElementById("question-text");
    const feedback    = document.getElementById("feedback");
    const explanation = document.getElementById("explanation");
    const nextBtn     = document.getElementById("next-btn");
    const backBtn     = document.getElementById("back-btn");
    if (backBtn) backBtn.remove();            // forward-only flow

    const quizContainer = document.querySelector(".quiz-container") || document.body;

    // Optional scene image (created once; mirrors the MCQ engine). Lets any
    // subject show a picture above the question — e.g. a spatial scene. Image
    // paths may be TODO placeholders: a missing image hides itself gracefully
    // instead of showing a broken-image icon.
    const questionSection = document.querySelector(".question-section") || quizContainer;
    let questionImage = questionSection.querySelector("img.question-image");
    if (!questionImage) {
      questionImage = document.createElement("img");
      questionImage.className = "question-image hidden";
      questionSection.insertBefore(questionImage, questionSection.firstChild);
    }
    questionImage.addEventListener("error", () => {
      questionImage.classList.add("hidden");
      questionImage.removeAttribute("src");
    });

    // Grid the tiles are rendered into (author supplies #tap-grid).
    let grid = document.getElementById("tap-grid");
    if (!grid) {
      grid = document.createElement("div");
      grid.id = "tap-grid";
      grid.className = "tap-grid";
      // place it right after the question section if we can
      const qSection = document.querySelector(".question-section") || qText;
      if (qSection && qSection.parentNode) {
        qSection.parentNode.insertBefore(grid, qSection.nextSibling);
      } else {
        quizContainer.appendChild(grid);
      }
    }

    // Live tap counter (created once, above the grid).
    let counter = document.getElementById("tap-counter");
    if (!counter) {
      counter = document.createElement("div");
      counter.id = "tap-counter";
      counter.className = "tap-counter hidden";
      grid.parentNode.insertBefore(counter, grid);
    }

    // Check button (created once, after the grid / before feedback).
    let checkBtn = document.getElementById("check-btn");
    if (!checkBtn) {
      checkBtn = document.createElement("button");
      checkBtn.id = "check-btn";
      checkBtn.type = "button";
      checkBtn.textContent = "Check";
      checkBtn.className = "hidden";
      grid.parentNode.insertBefore(checkBtn, grid.nextSibling);
    }

    // Progress indicator (same pattern/markup as the MCQ engine).
    let progress = document.getElementById("quiz-progress");
    if (!progress) {
      progress = document.createElement("div");
      progress.id = "quiz-progress";
      progress.className = "quiz-progress";
      progress.setAttribute("role", "progressbar");
      progress.setAttribute("aria-valuemin", "0");
      progress.setAttribute("aria-valuemax", String(questions.length));
      progress.innerHTML =
        '<div class="quiz-progress-meta">' +
          '<span class="quiz-progress-label">Question ' +
            '<strong id="q-current">1</strong> of <strong id="q-total"></strong>' +
          '</span>' +
          '<span class="quiz-progress-pct" id="q-pct">0%</span>' +
        '</div>' +
        '<div class="quiz-progress-track"><span class="quiz-progress-fill" id="q-fill"></span></div>';
      quizContainer.insertBefore(progress, quizContainer.firstChild);
    }
    const qCurrent = progress.querySelector("#q-current");
    const qTotal   = progress.querySelector("#q-total");
    const qPct     = progress.querySelector("#q-pct");
    const qFill    = progress.querySelector("#q-fill");
    if (qTotal) qTotal.textContent = String(questions.length);

    // --- Boot ---
    checkBtn.addEventListener("click", onCheck);
    nextBtn.addEventListener("click", onNext);
    loadQuestion();

    /* -------------------- Rendering -------------------- */
    function loadQuestion() {
      const q = questions[current];

      // Reset per-question state
      answered = false;
      selected.clear();
      unlockNext();

      // Interpret the question shape
      items = normalizeItems(q.items);
      countMode = (typeof q.count === "number" && q.count > 0);
      target = countMode ? q.count : items.filter((it) => it.correct).length;
      if (!target || target < 1) target = 1;        // defensive
      const instant = (target === 1);               // single tap = instant check

      updateProgress();

      // Question text
      qText.innerHTML = stripLeadingNumber(q.question) || "Tap the correct answer.";

      // Optional scene image (TODO placeholders allowed; hidden if missing)
      if (q.image) {
        questionImage.src = q.image;
        questionImage.alt = q.alt || "";
        questionImage.classList.remove("hidden");
      } else {
        questionImage.classList.add("hidden");
        questionImage.removeAttribute("src");
        questionImage.removeAttribute("alt");
      }

      // Reset feedback / explanation / buttons
      feedback.classList.add("hidden");
      explanation.classList.add("hidden");
      nextBtn.classList.add("hidden");

      // Counter: only shown in multi-tap flows (helps counting)
      if (instant) {
        counter.classList.add("hidden");
      } else {
        counter.classList.remove("hidden");
        updateCounter();
      }

      // Check button: only for multi-tap flows
      if (instant) {
        checkBtn.classList.add("hidden");
      } else {
        checkBtn.classList.remove("hidden");
        setCheckEnabled(false);
      }

      // Build tiles. An optional per-question layout ("row" / "column")
      // arranges tiles for spatial concepts (left/right, above/below);
      // otherwise the default responsive grid is used. Setting className
      // fresh also clears the "locked" state from the previous question.
      const layout = (q.layout === "row" || q.layout === "column") ? " tap-grid--" + q.layout : "";
      grid.className = "tap-grid" + layout;
      grid.innerHTML = "";
      items.forEach((it, idx) => {
        const tile = document.createElement("button");
        tile.type = "button";
        tile.className = "tap-tile";
        tile.dataset.index = String(idx);
        tile.setAttribute("aria-pressed", "false");
        tile.innerHTML =
          `<span class="tap-label">${it.label}</span>` +
          `<span class="tap-badge" aria-hidden="true"></span>`;
        tile.addEventListener("click", () => onTileTap(idx, instant));
        grid.appendChild(tile);
      });
    }

    function tileAt(idx) {
      return grid.querySelector(`.tap-tile[data-index="${idx}"]`);
    }

    /* -------------------- Interaction -------------------- */
    function onTileTap(idx, instant) {
      if (answered) return;

      if (instant) {
        // Single-answer: evaluate immediately, MCQ-style.
        evaluate([idx]);
        return;
      }

      // Multi-tap: toggle this tile's selection.
      const tile = tileAt(idx);
      if (selected.has(idx)) {
        selected.delete(idx);
        tile.classList.remove("selected");
        tile.setAttribute("aria-pressed", "false");
      } else {
        selected.add(idx);
        tile.classList.add("selected");
        tile.setAttribute("aria-pressed", "true");
      }
      updateCounter();
      setCheckEnabled(selected.size > 0);
    }

    function onCheck() {
      if (answered || selected.size === 0) return;
      evaluate(Array.from(selected));
    }

    // Evaluate a set of chosen tile indices and lock the question.
    function evaluate(chosen) {
      answered = true;
      grid.classList.add("locked");
      checkBtn.classList.add("hidden");
      counter.classList.add("hidden");

      const chosenSet = new Set(chosen);
      let isRight;

      if (countMode) {
        // Any `target` tiles are acceptable.
        isRight = chosen.length === target;
        chosen.forEach((i) => {
          const t = tileAt(i);
          if (!t) return;
          t.classList.add(isRight ? "correct" : "incorrect");
          if (isRight) setBadge(t, "check");
        });
      } else {
        // Match mode: right = every correct tapped AND nothing wrong tapped.
        let allCorrectTapped = true;
        let noWrongTapped = true;
        items.forEach((it, i) => {
          const t = tileAt(i);
          if (!t) return;
          const tapped = chosenSet.has(i);
          if (tapped && it.correct) {
            t.classList.add("correct");
            setBadge(t, "check");
          } else if (tapped && !it.correct) {
            t.classList.add("incorrect");
            setBadge(t, "cross");
            noWrongTapped = false;
          } else if (!tapped && it.correct) {
            // Reveal the answer(s) the child should have tapped.
            t.classList.add("missed");
            setBadge(t, "check");
            allCorrectTapped = false;
          }
        });
        isRight = allCorrectTapped && noWrongTapped;
      }

      finish(isRight);
    }

    function finish(isRight) {
      if (isRight) correctCount++;

      feedback.innerHTML = isRight
        ? "<span>Well done ❤️</span>"
        : "<span>Oops, try again 😢</span>";
      feedback.style.color = isRight ? "green" : "red";
      feedback.style.textAlign = "center";
      feedback.classList.remove("hidden");

      const exp = questions[current].explanation || "";
      explanation.innerHTML = exp ? `<strong>Solution:</strong><br>${exp}` : "";
      explanation.classList.toggle("hidden", !exp);

      nextBtn.classList.remove("hidden");
      lockNext();
      tapEmojiRain(isRight ? "❤️" : "😭", 16, unlockNext);
    }

    /* -------------------- Navigation -------------------- */
    function onNext() {
      if (nextLocked) return;                 // celebration still playing
      current++;
      if (current < questions.length) {
        loadQuestion();
      } else {
        showCompletionScreen();
      }
    }

    function showCompletionScreen() {
      const total = questions.length;
      if (progress) progress.classList.add("hidden");

      qText.innerHTML = `
        <div class="completion-message" style="text-align:center; padding:2rem;">
          <h2>🎉 Quiz Completed! 🎉</h2>
          <p style="font-size:1.4rem; margin:1rem 0;">
            Your Score: <strong>${correctCount} / ${total}</strong>
          </p>
          <button id="home-btn" class="btn-home">Home</button>
        </div>
      `;

      grid.innerHTML = "";
      counter.classList.add("hidden");
      checkBtn.classList.add("hidden");
      checkBtn.style.display = "none";
      feedback.textContent = "";
      feedback.classList.add("hidden");
      explanation.textContent = "";
      explanation.classList.add("hidden");
      nextBtn.style.display = "none";

      const homeBtn = document.getElementById("home-btn");
      if (homeBtn) {
        homeBtn.addEventListener("click", () => {
          const headerHome =
            document.querySelector(".logo-link") ||
            document.querySelector(".site-header .logo a") ||
            document.querySelector('nav a[href$="index.html"]');
          const href = headerHome
            ? headerHome.getAttribute("href")
            : (window.base || "/") + "index.html";
          location.href = href;
        });
      }
    }

    /* -------------------- Small helpers -------------------- */
    function updateProgress() {
      const n = current + 1;
      const total = questions.length || 1;
      const pct = Math.round((n / total) * 100);
      if (qCurrent) qCurrent.textContent = String(n);
      if (qPct)     qPct.textContent = pct + "%";
      if (qFill)    qFill.style.width = pct + "%";
      progress.setAttribute("aria-valuenow", String(n));
    }

    function updateCounter() {
      counter.innerHTML = `<span class="tap-counter-icon" aria-hidden="true">👆</span> Tapped: <strong>${selected.size}</strong>`;
    }

    function setCheckEnabled(on) {
      checkBtn.classList.toggle("is-disabled", !on);
      checkBtn.disabled = !on;
    }

    function setBadge(tile, type) {
      const b = tile.querySelector(".tap-badge");
      if (!b) return;
      b.textContent = type === "check" ? "✔️" : "✖️";
    }

    function lockNext() {
      nextLocked = true;
      nextBtn.classList.add("is-locked");
      nextBtn.setAttribute("aria-disabled", "true");
    }
    function unlockNext() {
      nextLocked = false;
      nextBtn.classList.remove("is-locked");
      nextBtn.removeAttribute("aria-disabled");
    }
  };
})();
