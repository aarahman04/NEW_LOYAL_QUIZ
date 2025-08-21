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
