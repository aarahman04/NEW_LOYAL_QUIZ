;(function() {
  /**
   * Initialize a drag-and-drop quiz for a list of questions.
   * Each question object needs:
   *  - question:     string with “……” where the dropzone goes
   *  - options:      array of strings (the draggable choices)
   *  - correct:      the exact string that is right
   *  - explanation:  string to show after they drop
   */
  function initDragDropQuiz(questions) {
    let current = 0;
    let correctCount = 0;

    // grab DOM elements
    const qText       = document.getElementById("question-text");
    const choices     = document.getElementById("choices");
    const feedback    = document.getElementById("feedback");
    const explanation = document.getElementById("explanation");
    const nextBtn     = document.getElementById("next-btn");
    const backBtn     = document.getElementById("back-btn");

    // load question at index `current`
    function loadQuestion() {
      const q = questions[current];
      // inject dropzone in place of the dots
      qText.innerHTML = q.question.replace(/…+/g, `<span id="dropzone" class="dropzone"></span>`);

      // reset UI
      choices.innerHTML      = "";
      feedback.classList.add("hidden");
      explanation.classList.add("hidden");
      nextBtn.classList.add("hidden");
      backBtn.classList.toggle("hidden", current === 0);

      // create draggable boxes
      q.options.forEach(opt => {
        const d = document.createElement("div");
        d.className   = "draggable";
        d.draggable   = true;
        d.textContent = opt;
        choices.appendChild(d);
      });

      attachDragHandlers(q.correct, q.explanation);
    }

    // set up drag/drop events for this question
    function attachDragHandlers(correctAnswer, explanationText) {
      const draggables = document.querySelectorAll(".draggable");
      const dropzone   = document.getElementById("dropzone");

      // clear any old content or classes
      dropzone.textContent = "";
      dropzone.classList.remove("over", "correct", "incorrect");

      // when drag starts, store the text
      draggables.forEach(el => {
        el.addEventListener("dragstart", e => {
          e.dataTransfer.setData("text/plain", el.textContent);
        });
      });

      // highlight dropzone on dragover
      dropzone.addEventListener("dragover", e => {
        e.preventDefault();
        dropzone.classList.add("over");
      });
      dropzone.addEventListener("dragleave", () => {
        dropzone.classList.remove("over");
      });

      // on drop, check the answer but do NOT auto-advance
      dropzone.addEventListener("drop", e => {
        e.preventDefault();
        dropzone.classList.remove("over");

        const droppedValue = e.dataTransfer.getData("text/plain");
        dropzone.textContent = droppedValue;

        // mark correct/incorrect and emoji rain
        const wasCorrect = (droppedValue === correctAnswer);
        if (wasCorrect) correctCount++;
        checkAnswer(dropzone, droppedValue, correctAnswer, wasCorrect ? "🎉" : "😢");

        // show explanation & Next button
        explanation.textContent = explanationText;
        explanation.classList.remove("hidden");
        nextBtn.classList.remove("hidden");
      });
    }

    // Next navigates forward or shows completion if last
    nextBtn.addEventListener("click", () => {
      if (current < questions.length - 1) {
        current++;
        loadQuestion();
      } else {
        showCompletionScreen();
      }
    });

    // Back navigates backward
    backBtn.addEventListener("click", () => {
      if (current > 0) {
        current--;
        loadQuestion();
      }
    });

    // start the quiz
    loadQuestion();

    // ─── Answer checking + Emoji rain ────────────────────────

    /**
     * Disable further drops, add styling, show feedback & rain.
     * @param {HTMLElement} el       – the dropzone element
     * @param {string} chosen        – what was dropped
     * @param {string} correct       – the right string
     * @param {string} rainEmoji     – emoji to rain (e.g. "🎉" or "😢")
     */
    function checkAnswer(el, chosen, correct, rainEmoji) {
      // disable more drops
      el.draggable = false;
      el.classList.add(chosen === correct ? "correct" : "incorrect");

      // show feedback text
      const fb = document.getElementById("feedback");
      if (chosen === correct) {
        fb.textContent = "✅ Correct!";
        fb.style.color = "green";
      } else {
        fb.textContent = "😢 Oops wrong answer";
        fb.style.color = "red";
      }
      fb.classList.remove("hidden");

      // rain emojis
      addEmojiRain(rainEmoji, 30);
    }

    /**
     * Create falling emojis in a full-screen container.
     */
    function addEmojiRain(emoji, count = 30) {
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

      // cleanup
      setTimeout(() => {
        if (container.childElementCount === 0) container.remove();
      }, 6000);
    }

    // ─── Completion Screen ─────────────────────────────

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

  // expose the init function
  window.initDragDropQuiz = initDragDropQuiz;
})();


(function () {
  // ───────────────────────────────────────────────────────────────────────────
  // Two-box sort quiz (Proper vs Common, etc.)
  // Locks after first wrong drop; user must press Next. Uses ✅/😢 + emoji rain.
  // HTML must include:
  //   <div class="dropbox" data-box="left"  data-placeholder="Proper Noun"></div>
  //   <div class="dropbox" data-box="right" data-placeholder="Common Noun"></div>
  // Exposed as: window.initTwoBoxSortQuiz(questions)
  // ───────────────────────────────────────────────────────────────────────────

  function initTwoBoxSortQuiz(qs) {
    let current = 0;
    let correctCount = 0;
    let locked = false;                  // freeze current question after wrong drop
    let handlersBound = false;           // avoid stacking listeners on the boxes

    // DOM hooks
    const qText       = document.getElementById("question-text");
    const choices     = document.getElementById("choices");
    const feedback    = document.getElementById("feedback");
    const explanation = document.getElementById("explanation");
    const nextBtn     = document.getElementById("next-btn");
    const backBtn     = document.getElementById("back-btn");

    const leftBox  = document.querySelector('.dropbox[data-box="left"]');
    const rightBox = document.querySelector('.dropbox[data-box="right"]');

    if (!leftBox || !rightBox) {
      console.error("Two drop boxes with data-box='left' and data-box='right' are required.");
      return;
    }

    // ── Load one question ────────────────────────────────────────────────────
    function loadQuestion() {
      const q = qs[current];
      locked = false;

      qText.innerHTML = q.question || "Drag each word to the correct box.";

      // Reset targets
      [leftBox, rightBox].forEach(box => {
        box.textContent = "";
        box.classList.remove("over", "correct", "wrong", "has-value");
      });

      // Reset UI
      choices.innerHTML = "";
      clearFeedback();
      explanation.textContent = "";
      explanation.classList.add("hidden");
      nextBtn.classList.add("hidden");
      backBtn.classList.toggle("hidden", current === 0);

      // Build draggables (shuffle)
      const items = shuffle([...(q.options || [])]);
      items.forEach(opt => {
        const d = document.createElement("div");
        d.className   = "draggable";
        d.draggable   = true;
        d.textContent = String(opt);
        choices.appendChild(d);
      });

      bindDraggables();           // set dragstart on the chips (they change each Q)
      bindDropzonesOnce();        // bind drop targets only once
    }

    // ── Draggable chips: dragstart carries the text ──────────────────────────
    function bindDraggables() {
      choices.querySelectorAll(".draggable").forEach(el => {
        el.addEventListener("dragstart", e => {
          if (locked) { e.preventDefault(); return; }
          e.dataTransfer.setData("text/plain", el.textContent);
        });
      });
    }

    // ── Dropzones: bind once and use current question at drop time ───────────
    function bindDropzonesOnce() {
      if (handlersBound) return;
      [leftBox, rightBox].forEach(box => {
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
          handleDrop(e, qs[current], box);    // always use the active question
        });
      });
      handlersBound = true;
    }

    // ── Handle a drop into a box ─────────────────────────────────────────────
    function handleDrop(e, q, box) {
      const droppedValue = e.dataTransfer.getData("text/plain");

      // Fill/replace this box
      box.textContent = droppedValue;
      box.classList.add("has-value");

      // Decide which side is correct for this word
      const correctSide = resolveCorrectSide(q, droppedValue);
      const isCorrect = (correctSide === box.dataset.box);

      // Visual mark for THIS box (use .wrong to match your CSS)
      box.classList.remove("correct", "wrong");
      box.classList.add(isCorrect ? "correct" : "wrong");

      // Disable the dragged chip so it can’t be reused
      const chip = [...choices.children].find(c => c.textContent === droppedValue);
      if (chip) { chip.draggable = false; chip.style.opacity = "0.7"; chip.style.cursor = "default"; }

      if (!isCorrect) {
        // First wrong drop → lock question; user must press Next
        locked = true;
        disableAllDragging();
        checkAnswer(false, "😭");                 // red text + crying rain
        explanation.textContent = q.explanation || "";
        explanation.classList.remove("hidden");
        nextBtn.classList.remove("hidden");
        return;
      }

      // Show positive feedback (keep playing until both correct)
      checkAnswer(true, "❤️");

      // If both boxes are correct and filled → finish (no auto-advance)
      const bothCorrect =
        leftBox.classList.contains("correct") &&
        rightBox.classList.contains("correct") &&
        leftBox.classList.contains("has-value") &&
        rightBox.classList.contains("has-value");

      if (bothCorrect) {
        locked = true;
        disableAllDragging();
        correctCount++;
        explanation.textContent = q.explanation || "";
        explanation.classList.remove("hidden");
        nextBtn.classList.remove("hidden");
      }
    }

    // ── Decide which side a word belongs to ─────────────────────────────────
    function resolveCorrectSide(q, word) {
      // 1) explicit map wins
      if (q.key && typeof q.key === "object") {
        const v = q.key[word];
        if (v === "left" || v === "right") return v;
      }
      // 2) fallback for 2-option questions: first=left, second=right
      if (Array.isArray(q.options) && q.options.length === 2) {
        return (word === q.options[0]) ? "left" : "right";
      }
      return "unknown";
    }

    // ── Answer feedback + emoji rain (same style as your other quiz) ────────
    function checkAnswer(isCorrect, rainEmoji) {
      const fb = feedback;
      fb.textContent = isCorrect ? "✅ Correct!" : "😢 Oops wrong answer";
      fb.style.color = isCorrect ? "green" : "red";
      fb.style.textAlign = "center";
      fb.classList.remove("hidden");
      addEmojiRain(rainEmoji, 30);
    }

    function addEmojiRain(emoji, count = 30) {
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

    // ── Navigation (no auto-advance) ────────────────────────────────────────
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

    // ── Completion screen ───────────────────────────────────────────────────
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

    // ── Helpers ─────────────────────────────────────────────────────────────
    function disableAllDragging() {
      choices.querySelectorAll(".draggable").forEach(d => {
        d.draggable = false;
        d.style.cursor = "default";
        d.style.opacity = "0.7";
      });
      [leftBox, rightBox].forEach(b => b.classList.remove("over"));
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

    // Kick off
    loadQuestion();
  }

  // Expose globally
  window.initTwoBoxSortQuiz = initTwoBoxSortQuiz;
})();
