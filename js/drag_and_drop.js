/* ============================================================
   Emoji rain utility (shared)
   - Success rain only when all .dropbox in scope are correct
   - Pass { force: true } to show rain even when not all correct
   ============================================================ */
function addEmojiRain(emoji, count = 30, scope = document, opts) {
  const force = !!(opts && opts.force);

  if (!force) {
    const dropboxes = Array.from(scope.querySelectorAll(".dropbox"));
    const allCorrect =
      dropboxes.length > 0 &&
      dropboxes.every(b => b.classList.contains("has-value") && b.classList.contains("correct"));
    if (!allCorrect) return; // gate success-only effects
  }

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
    drop.style.left              = `${5 + Math.random() * 70}%`;
    drop.style.fontSize          = `${3 + Math.random() * 3}rem`;
    drop.style.animationDuration = `${2 + Math.random() * 3}s`;
    drop.style.animationDelay    = `${Math.random()}s`;
    container.appendChild(drop);
    drop.addEventListener("animationend", () => drop.remove());
  }

  setTimeout(() => {
    if (container.childElementCount === 0) container.remove();
  }, 6000);
}

/* =====================================================================
   1) Single-drop “fill the blank” drag & drop quiz
   Expose as: window.initDragDropQuiz(questions)
   Question shape:
     { question: "Ali went to …", options:["school","market"], correct:"market", explanation:"..." }
   ===================================================================== */
;(function () {
  function initDragDropQuiz(questions) {
    let current = 0;
    let correctCount = 0;

    // DOM
    const qText       = document.getElementById("question-text");
    const choices     = document.getElementById("choices");
    const feedback    = document.getElementById("feedback");
    const explanation = document.getElementById("explanation");
    const nextBtn     = document.getElementById("next-btn");
    const backBtn     = document.getElementById("back-btn");

    const scope = qText.closest(".quiz-container") || document;

    function loadQuestion() {
      const q = questions[current];

      // inject single dropzone where ellipsis lives
      qText.innerHTML = q.question.replace(/…+/g, `<span id="dropzone" class="dropzone"></span>`);

      // reset UI
      choices.innerHTML      = "";
      feedback.classList.add("hidden");
      explanation.classList.add("hidden");
      nextBtn.classList.add("hidden");
      backBtn.classList.toggle("hidden", current === 0);

      // choices
      q.options.forEach(opt => {
        const d = document.createElement("div");
        d.className   = "draggable";
        d.draggable   = true;
        d.textContent = opt;
        choices.appendChild(d);
      });

      attachDragHandlers(q.correct, q.explanation);
    }

    function attachDragHandlers(correctAnswer, explanationText) {
      const draggables = document.querySelectorAll(".draggable");
      const dropzone   = document.getElementById("dropzone");

      dropzone.textContent = "";
      dropzone.classList.remove("over", "correct", "incorrect", "has-value");

      draggables.forEach(el => {
        el.addEventListener("dragstart", e => {
          e.dataTransfer.setData("text/plain", el.textContent);
        });
      });

      dropzone.addEventListener("dragover", e => {
        e.preventDefault();
        dropzone.classList.add("over");
      });
      dropzone.addEventListener("dragleave", () => {
        dropzone.classList.remove("over");
      });

      dropzone.addEventListener("drop", e => {
        e.preventDefault();
        dropzone.classList.remove("over");

        const droppedValue = e.dataTransfer.getData("text/plain");
        dropzone.textContent = droppedValue;
        dropzone.classList.add("has-value");

        const wasCorrect = (droppedValue === correctAnswer);
        if (wasCorrect) correctCount++;

        checkAnswer(dropzone, droppedValue, correctAnswer, wasCorrect);

        explanation.textContent = explanationText || "";
        explanation.classList.remove("hidden");
        nextBtn.classList.remove("hidden");
      });
    }

    function checkAnswer(el, chosen, correct, isCorrect) {
      el.draggable = false;
      el.classList.remove("correct", "incorrect");
      el.classList.add(isCorrect ? "correct" : "incorrect");

      // feedback
      feedback.textContent = isCorrect ? "✅ Correct!" : "😢 Oops wrong answer";
      feedback.style.color = isCorrect ? "green" : "red";
      feedback.classList.remove("hidden");

      // emoji rain: sad on wrong (forced), success on right (gated)
      if (isCorrect) {
        addEmojiRain("🎉", 30, scope);
      } else {
        addEmojiRain("😢", 20, scope, { force: true });
      }
    }

    // navigation
    nextBtn.addEventListener("click", () => {
      if (current < questions.length - 1) {
        current++;
        loadQuestion();
      } else {
        showCompletionScreen();
      }
    });

    backBtn.addEventListener("click", () => {
      if (current > 0) {
        current--;
        loadQuestion();
      }
    });

    // start
    loadQuestion();

    // completion (kept exactly like yours)
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
      choices.innerHTML      = "";
      feedback.textContent   = "";
      feedback.classList.add("hidden");
      explanation.textContent= "";
      explanation.classList.add("hidden");
      nextBtn.style.display  = "none";
      backBtn.style.display  = "none";

      document.getElementById("home-btn").addEventListener("click", () => {
        window.location.href = window.location.origin + "/index.html";
      });
    }
  }

  window.initDragDropQuiz = initDragDropQuiz;
})();

/* =====================================================================
   2) Multi-box sort quiz (2+ dropzones)
   Expose as: window.initTwoBoxSortQuiz(questions)
   Question shape:
     {
       question: "Sort each word to the correct box.",
       options: ["boy","Jeddah","love"],
       key: { "Jeddah":"proper", "boy":"common", "love":"abstract" },
       explanation: "..."
     }
   HTML:
     <div class="dropbox" data-box="proper"   data-placeholder="Proper Noun"></div>
     <div class="dropbox" data-box="common"   data-placeholder="Common Noun"></div>
     <div class="dropbox" data-box="abstract" data-placeholder="Abstract Noun"></div>
   ===================================================================== */
;(function () {
  function initTwoBoxSortQuiz(qs) {
    let current = 0;
    let correctCount = 0;
    let locked = false;
    let handlersBound = false;

    // DOM
    const qText       = document.getElementById("question-text");
    const choices     = document.getElementById("choices");
    const feedback    = document.getElementById("feedback");
    const explanation = document.getElementById("explanation");
    const nextBtn     = document.getElementById("next-btn");
    const backBtn     = document.getElementById("back-btn");

    const scope = qText.closest(".quiz-container") || document;

    const dropboxes = Array.from(document.querySelectorAll(".dropbox"));
    if (!dropboxes.length) {
      console.error("At least one .dropbox is required with a unique data-box.");
      return;
    }

    function loadQuestion() {
      const q = qs[current];
      locked = false;

      qText.innerHTML = q.question || "Drag each word to the correct box.";

      // reset targets
      dropboxes.forEach(box => {
        box.textContent = "";
        box.classList.remove("over", "correct", "wrong", "has-value");
      });

      // reset UI
      choices.innerHTML = "";
      clearFeedback();
      explanation.textContent = "";
      explanation.classList.add("hidden");
      nextBtn.classList.add("hidden");
      backBtn.classList.toggle("hidden", current === 0);

      // build draggables
      const items = [...(q.options || [])];
      items.forEach(opt => {
        const d = document.createElement("div");
        d.className   = "draggable";
        d.draggable   = true;
        d.textContent = String(opt);
        choices.appendChild(d);
      });

      bindDraggables();
      bindDropzonesOnce();
    }

    function bindDraggables() {
      choices.querySelectorAll(".draggable").forEach(el => {
        el.addEventListener("dragstart", e => {
          if (locked) { e.preventDefault(); return; }
          e.dataTransfer.setData("text/plain", el.textContent);
        });
      });
    }

    function bindDropzonesOnce() {
      if (handlersBound) return;
      dropboxes.forEach(box => {
        box.addEventListener("dragover", e => {
          if (locked) return;
          e.preventDefault();
          box.classList.add("over");
        });
        box.addEventListener("dragleave", () => box.classList.remove("over"));
        box.addEventListener("drop", e => {
          if (locked) return;
          e.preventDefault();
          box.classList.remove("over");
          handleDrop(e, qs[current], box);
        });
      });
      handlersBound = true;
    }

    function handleDrop(e, q, box) {
      const droppedValue = e.dataTransfer.getData("text/plain");

      // fill/replace this box (one value per box)
      box.textContent = droppedValue;
      box.classList.add("has-value");

      const correctTargetKey = resolveCorrectTarget(q, droppedValue); // e.g., "proper"
      const isCorrect = (correctTargetKey === box.dataset.box);

      // mark this box
      box.classList.remove("correct", "wrong");
      box.classList.add(isCorrect ? "correct" : "wrong");

      // disable the used chip
      const chip = [...choices.children].find(c => c.textContent === droppedValue);
      if (chip) { chip.draggable = false; chip.style.opacity = "0.7"; chip.style.cursor = "default"; }

      if (!isCorrect) {
        locked = true;
        disableAllDragging();
        // WRONG → show sad rain immediately
        showFeedback(false);
        addEmojiRain("😢", 20, scope, { force: true });
        explanation.textContent = q.explanation || "";
        explanation.classList.remove("hidden");
        nextBtn.classList.remove("hidden");
        return;
      }

      // correct drop; keep going
      showFeedback(true);

      // if all boxes filled & correct → lock and show Next
      const allCorrect = dropboxes.every(b =>
        b.classList.contains("has-value") && b.classList.contains("correct")
      );

      if (allCorrect) {
        locked = true;
        disableAllDragging();
        correctCount++;
        explanation.textContent = q.explanation || "";
        explanation.classList.remove("hidden");
        nextBtn.classList.remove("hidden");

        // SUCCESS → gated rain (will pass because all are correct)
        addEmojiRain("❤️", 30, scope);
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

    // nav
    nextBtn.addEventListener("click", () => {
      if (current < qs.length - 1) {
        current++;
        loadQuestion();
      } else {
        showCompletionScreen();
      }
    });

    backBtn.addEventListener("click", () => {
      if (current > 0) {
        current--;
        loadQuestion();
      }
    });

    // start
    loadQuestion();

    // completion screen (unchanged, but adapted to this quiz’s counters)
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

    // helpers
    function disableAllDragging() {
      choices.querySelectorAll(".draggable").forEach(d => {
        d.draggable = false;
        d.style.cursor = "default";
        d.style.opacity = "0.7";
      });
      dropboxes.forEach(b => b.classList.remove("over"));
    }

    function clearFeedback() {
      feedback.textContent = "";
      feedback.classList.add("hidden");
      feedback.style.color = "";
    }

    function shuffle(arr) {
      const a = [...arr];
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
      }
      return a;
    }
  }

  window.initTwoBoxSortQuiz = initTwoBoxSortQuiz;
})();
