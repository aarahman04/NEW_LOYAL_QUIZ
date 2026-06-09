/* ============================================================
   Emoji rain utility (shared)
   - Success rain only when all .dropbox in scope are correct
   - Pass { force: true } to show rain even when not all correct
   - onComplete() fires once the celebration window has elapsed
     (used to unlock the Next button so kids can't spam ahead)
   ============================================================ */
function addEmojiRain(emoji, count = 24, scope = document, opts, onComplete) {
  const done = typeof onComplete === "function" ? onComplete : function () {};
  const force = !!(opts && opts.force);

  if (!force) {
    const dropboxes = Array.from(scope.querySelectorAll(".dropbox"));
    const allCorrect =
      dropboxes.length > 0 &&
      dropboxes.every(b => b.classList.contains("has-value") && b.classList.contains("correct"));
    if (!allCorrect) { done(); return; } // gate success-only effects
  }

  // Replace any in-flight celebration so effects never stack up.
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
    const dur = 1.0 + Math.random() * 0.7;     // 1.0–1.7s
    const delay = Math.random() * 0.25;        // 0–0.25s
    maxEnd = Math.max(maxEnd, dur + delay);
    drop.style.left              = `${5 + Math.random() * 80}%`;
    drop.style.fontSize          = `${2.4 + Math.random() * 1.4}rem`;
    drop.style.animationDuration = `${dur}s`;
    drop.style.animationDelay    = `${delay}s`;
    container.appendChild(drop);
    drop.addEventListener("animationend", () => drop.remove());
  }

  setTimeout(() => {
    container.remove();
    done();
  }, Math.round(maxEnd * 1000) + 60);
}

/* Strip a stale leading list-marker ("1." / "12)" / "3 - x") from
   question text, without touching math like "3 - 1". */
function stripLeadingNumber(text) {
  if (typeof text !== "string") return text;
  return text
    .replace(/^\s*\d{1,3}\s*[.):]\s+/, "")
    .replace(/^\s*\d{1,3}\s+-\s+(?=\D)/, "");
}

/* ============================================================
   Kid-friendly pointer drag (mouse + touch)
   - Desktop (mouse/pen): pick up immediately.
   - Touch: requires a deliberate LONG PRESS before the chip is
     picked up, so scrolling/tapping never starts an accidental drag.
   - A floating clone follows the pointer; drop targets highlight
     via the `.over` class; on release onDrop(chip, target) runs.
   Relies on CSS: .draggable { touch-action:none } + .drag-clone.
   ============================================================ */
function enableKidDrag(el, opts) {
  const LONG_PRESS_MS = 250;   // deliberate hold on touch
  const MOVE_CANCEL   = 16;    // px of movement that cancels the hold (= scroll/flick)

  let timer = null, active = false, clone = null;
  let sx = 0, sy = 0, offX = 0, offY = 0, over = null, pid = null;

  el.addEventListener("pointerdown", down);

  function enabled() { return !opts.isEnabled || opts.isEnabled(); }

  function down(e) {
    if (!enabled()) return;
    if (e.button != null && e.button > 0) return;  // left/touch only
    pid = e.pointerId; sx = e.clientX; sy = e.clientY;

    if (e.pointerType === "touch") {
      el.classList.add("pressing");
      timer = setTimeout(() => activate(sx, sy), LONG_PRESS_MS);
      el.addEventListener("pointermove", preMove);
      el.addEventListener("pointerup", preUp);
      el.addEventListener("pointercancel", preUp);
    } else {
      activate(e.clientX, e.clientY);
    }
  }

  function preMove(e) {
    if (Math.hypot(e.clientX - sx, e.clientY - sy) > MOVE_CANCEL) cancelPress();
  }
  function preUp() { cancelPress(); }
  function cancelPress() {
    clearTimeout(timer); timer = null;
    el.classList.remove("pressing");
    el.removeEventListener("pointermove", preMove);
    el.removeEventListener("pointerup", preUp);
    el.removeEventListener("pointercancel", preUp);
  }

  function activate(x, y) {
    cancelPress();
    if (active || !enabled()) return;
    active = true;

    const r = el.getBoundingClientRect();
    offX = x - r.left; offY = y - r.top;

    clone = el.cloneNode(true);
    clone.classList.add("drag-clone");
    clone.classList.remove("pressing");
    clone.style.width  = r.width + "px";
    clone.style.height = r.height + "px";
    document.body.appendChild(clone);
    positionClone(x, y);

    el.classList.add("dragging");
    document.body.classList.add("dnd-active");
    try { el.setPointerCapture(pid); } catch (_) {}

    el.addEventListener("pointermove", move);
    el.addEventListener("pointerup", up);
    el.addEventListener("pointercancel", up);

    if (navigator.vibrate) { try { navigator.vibrate(8); } catch (_) {} }
  }

  function positionClone(x, y) {
    clone.style.left = (x - offX) + "px";
    clone.style.top  = (y - offY) + "px";
  }

  function move(e) {
    if (!active) return;
    e.preventDefault();
    positionClone(e.clientX, e.clientY);
    const t = under(e.clientX, e.clientY);
    if (t !== over) {
      if (over) over.classList.remove("over");
      over = t;
      if (over) over.classList.add("over");
    }
  }

  function under(x, y) {
    const elx = document.elementFromPoint(x, y);   // clone has pointer-events:none
    return elx ? elx.closest(opts.dropSelector) : null;
  }

  function up(e) {
    if (!active) return;
    e.preventDefault();
    const target = over;
    finish();
    if (target) {
      target.classList.remove("over");
      opts.onDrop(el, target);
    }
  }

  function finish() {
    active = false;
    el.classList.remove("dragging", "pressing");
    document.body.classList.remove("dnd-active");
    if (clone) { clone.remove(); clone = null; }
    if (over) { over.classList.remove("over"); over = null; }
    try { el.releasePointerCapture(pid); } catch (_) {}
    el.removeEventListener("pointermove", move);
    el.removeEventListener("pointerup", up);
    el.removeEventListener("pointercancel", up);
  }
}

/* =====================================================================
   1) Single-drop “fill the blank” drag & drop quiz
   Expose as: window.initDragDropQuiz(questions)
   ===================================================================== */
;(function () {
  function initDragDropQuiz(questions) {
    let current = 0;
    let correctCount = 0;
    let answered = false;
    let nextLocked = false;

    const qText       = document.getElementById("question-text");
    const choices     = document.getElementById("choices");
    const feedback    = document.getElementById("feedback");
    const explanation = document.getElementById("explanation");
    const nextBtn     = document.getElementById("next-btn");
    const backBtn     = document.getElementById("back-btn");
    if (backBtn) backBtn.remove();              // forward-only flow

    const scope = qText.closest(".quiz-container") || document;

    function loadQuestion() {
      const q = questions[current];
      answered = false;
      unlockNext();

      qText.innerHTML = stripLeadingNumber(q.question).replace(/…+/g, `<span id="dropzone" class="dropzone"></span>`);

      choices.innerHTML = "";
      feedback.classList.add("hidden");
      explanation.classList.add("hidden");
      nextBtn.classList.add("hidden");

      const dropzone = document.getElementById("dropzone");
      dropzone.textContent = "";
      dropzone.classList.remove("over", "correct", "incorrect", "has-value");

      q.options.forEach(opt => {
        const d = document.createElement("div");
        d.className = "draggable";
        d.draggable = false;                    // native drag off; pointer drag on
        d.textContent = opt;
        choices.appendChild(d);
        enableKidDrag(d, {
          dropSelector: ".dropzone",
          isEnabled: () => !answered,
          onDrop: (chip, zone) => doDrop(chip, zone, q.correct, q.explanation),
        });
      });
    }

    function doDrop(chip, zone, correctAnswer, explanationText) {
      if (answered) return;
      answered = true;

      const droppedValue = chip.textContent;
      zone.textContent = droppedValue;
      zone.classList.add("has-value");

      const wasCorrect = (droppedValue === correctAnswer);
      if (wasCorrect) correctCount++;

      zone.classList.remove("correct", "incorrect");
      zone.classList.add(wasCorrect ? "correct" : "incorrect");
      choices.querySelectorAll(".draggable").forEach(c => c.classList.add("used"));

      feedback.textContent = wasCorrect ? "✅ Correct!" : "😢 Oops wrong answer";
      feedback.style.color = wasCorrect ? "green" : "red";
      feedback.style.textAlign = "center";
      feedback.classList.remove("hidden");

      explanation.textContent = explanationText || "";
      explanation.classList.remove("hidden");
      nextBtn.classList.remove("hidden");

      lockNext();
      addEmojiRain(wasCorrect ? "🎉" : "😢", wasCorrect ? 24 : 18, scope, { force: true }, unlockNext);
    }

    nextBtn.addEventListener("click", () => {
      if (nextLocked) return;
      if (current < questions.length - 1) {
        current++;
        loadQuestion();
      } else {
        showCompletionScreen();
      }
    });

    function lockNext()   { nextLocked = true;  nextBtn.classList.add("is-locked");    nextBtn.setAttribute("aria-disabled", "true"); }
    function unlockNext() { nextLocked = false; nextBtn.classList.remove("is-locked"); nextBtn.removeAttribute("aria-disabled"); }

    loadQuestion();

    function showCompletionScreen() {
      const total = questions.length;
      qText.innerHTML = `
        <div class="completion-message" style="text-align:center; padding:2rem;">
          <h2>🎉 Quiz Completed! 🎉</h2>
          <p style="font-size:1.4rem; margin:1rem 0;">
            Your Score: <strong>${correctCount} / ${total}</strong>
          </p>
          <button id="home-btn" class="btn-home">Home</button>
        </div>
      `;
      choices.innerHTML       = "";
      feedback.textContent    = "";
      feedback.classList.add("hidden");
      explanation.textContent = "";
      explanation.classList.add("hidden");
      nextBtn.style.display   = "none";

      document.getElementById("home-btn").addEventListener("click", () => {
        const headerHome =
          document.querySelector(".logo-link") ||
          document.querySelector('nav a[href$="index.html"]');
        location.href = headerHome ? headerHome.getAttribute("href")
                                   : window.location.origin + "/index.html";
      });
    }
  }

  window.initDragDropQuiz = initDragDropQuiz;
})();

/* =====================================================================
   2) Multi-box sort quiz (2+ dropzones)
   Expose as: window.initTwoBoxSortQuiz(questions)
   ===================================================================== */
;(function () {
  function initTwoBoxSortQuiz(qs) {
    let current = 0;
    let correctCount = 0;
    let locked = false;          // drag interaction locked (after final/ wrong)
    let nextLocked = false;      // Next locked during celebration

    const qText       = document.getElementById("question-text");
    const choices     = document.getElementById("choices");
    const feedback    = document.getElementById("feedback");
    const explanation = document.getElementById("explanation");
    const nextBtn     = document.getElementById("next-btn");
    const backBtn     = document.getElementById("back-btn");
    if (backBtn) backBtn.remove();              // forward-only flow

    const scope = qText.closest(".quiz-container") || document;

    const dropboxes = Array.from(document.querySelectorAll(".dropbox"));
    if (!dropboxes.length) {
      console.error("At least one .dropbox is required with a unique data-box.");
      return;
    }

    function loadQuestion() {
      const q = qs[current];
      locked = false;
      unlockNext();

      qText.innerHTML = stripLeadingNumber(q.question) || "Drag each word to the correct box.";

      dropboxes.forEach(box => {
        box.textContent = "";
        box.classList.remove("over", "correct", "wrong", "has-value");
      });

      choices.innerHTML = "";
      clearFeedback();
      explanation.textContent = "";
      explanation.classList.add("hidden");
      nextBtn.classList.add("hidden");

      (q.options || []).forEach(opt => {
        const d = document.createElement("div");
        d.className = "draggable";
        d.draggable = false;
        d.textContent = String(opt);
        choices.appendChild(d);
        enableKidDrag(d, {
          dropSelector: ".dropbox",
          isEnabled: () => !locked,
          onDrop: (chip, box) => handleDrop(chip, box, qs[current]),
        });
      });
    }

    function handleDrop(chip, box, q) {
      if (locked) return;
      const droppedValue = chip.textContent;

      box.textContent = droppedValue;
      box.classList.add("has-value");

      const correctTargetKey = resolveCorrectTarget(q, droppedValue);
      const isCorrect = (correctTargetKey === box.dataset.box);

      box.classList.remove("correct", "wrong");
      box.classList.add(isCorrect ? "correct" : "wrong");

      chip.classList.add("used");

      if (!isCorrect) {
        locked = true;
        disableAllDragging();
        showFeedback(false);
        explanation.textContent = q.explanation || "";
        explanation.classList.remove("hidden");
        nextBtn.classList.remove("hidden");
        lockNext();
        addEmojiRain("😢", 18, scope, { force: true }, unlockNext);
        return;
      }

      showFeedback(true);

      const allCorrect = dropboxes.every(b =>
        b.classList.contains("has-value") && b.classList.contains("correct"));

      if (allCorrect) {
        locked = true;
        disableAllDragging();
        correctCount++;
        explanation.textContent = q.explanation || "";
        explanation.classList.remove("hidden");
        nextBtn.classList.remove("hidden");
        lockNext();
        addEmojiRain("❤️", 26, scope, undefined, unlockNext);   // gated success rain
      }
    }

    function resolveCorrectTarget(q, word) {
      if (q.key && typeof q.key === "object" && word in q.key) return q.key[word];
      if (Array.isArray(q.options) && q.options.length === dropboxes.length) {
        const idx = q.options.indexOf(word);
        if (idx >= 0) return dropboxes[idx].dataset.box;
      }
      return "unknown";
    }

    function showFeedback(isCorrect) {
      feedback.textContent = isCorrect ? "✅ Correct!" : "😢 Oops wrong answer";
      feedback.style.color = isCorrect ? "green" : "red";
      feedback.style.textAlign = "center";
      feedback.classList.remove("hidden");
    }

    nextBtn.addEventListener("click", () => {
      if (nextLocked) return;
      if (current < qs.length - 1) {
        current++;
        loadQuestion();
      } else {
        showCompletionScreen();
      }
    });

    function lockNext()   { nextLocked = true;  nextBtn.classList.add("is-locked");    nextBtn.setAttribute("aria-disabled", "true"); }
    function unlockNext() { nextLocked = false; nextBtn.classList.remove("is-locked"); nextBtn.removeAttribute("aria-disabled"); }

    loadQuestion();

    function showCompletionScreen() {
      qText.innerHTML = `
        <div class="completion-message" style="text-align:center; padding:2rem;">
          <h2>🎉 Quiz Completed! 🎉</h2>
          <p style="font-size:1.4rem; margin:1rem 0;">
            Your Score: <strong>${correctCount} / ${qs.length}</strong>
          </p>
          <button id="home-btn" class="btn-home">Home</button>
        </div>
      `;
      choices.innerHTML       = "";
      clearFeedback();
      explanation.textContent = "";
      explanation.classList.add("hidden");
      nextBtn.style.display   = "none";

      document.getElementById("home-btn").addEventListener("click", () => {
        const headerHome =
          document.querySelector(".logo-link") ||
          document.querySelector('nav a[href$="index.html"]');
        location.href = headerHome ? headerHome.getAttribute("href")
                                   : window.location.origin + "/index.html";
      });
    }

    function disableAllDragging() {
      choices.querySelectorAll(".draggable").forEach(d => d.classList.add("used"));
      dropboxes.forEach(b => b.classList.remove("over"));
    }

    function clearFeedback() {
      feedback.textContent = "";
      feedback.classList.add("hidden");
      feedback.style.color = "";
    }
  }

  window.initTwoBoxSortQuiz = initTwoBoxSortQuiz;
})();
