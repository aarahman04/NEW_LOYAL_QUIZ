/* ================================
   MCQ Quiz (clean + fixed)
   ================================= */

(function () {
  // How many questions to show per attempt (drawn from the full bank).
  const QUIZ_SIZE = 25;

  // Fisher–Yates shuffle on a COPY (never mutate the caller's bank).
  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  // Pick a fresh random subset of up to `size` items from the full bank.
  function pickSubset(bank, size) {
    const list = Array.isArray(bank) ? bank : [];
    return shuffle(list).slice(0, Math.min(size, list.length));
  }

  // Public init
  window.initMCQQuiz = function initMCQQuiz(allQuestions) {
    // Draw a new random 25 from the 100-question bank every time the
    // exercise is opened. Order is randomized too.
    const questions = pickSubset(allQuestions, QUIZ_SIZE);

    // --- State ---
    let currentQuestionIndex = 0;
    let correctCount = 0;

    // --- Elements ---
    const questionText   = document.getElementById("question-text");
    const optionsList    = document.getElementById("options-list");
    const feedbackDiv    = document.getElementById("feedback");
    const explanationDiv = document.getElementById("explanation");
    const nextBtn        = document.getElementById("next-btn");
    const backBtn        = document.getElementById("back-btn");
    const optionLabels   = ["A", "B", "C", "D"];

    // Forward-only flow: remove the Back button from the DOM entirely so it
    // can't be seen, clicked, focused, or reached by keyboard.
    if (backBtn) backBtn.remove();

    // Interaction guards: block double-answers and lock Next while the
    // celebration animation is playing.
    let answered   = false;
    let nextLocked = false;

    // Create/reuse single <img> above question text
    const questionSection = document.querySelector(".question-section") || document.body;
    let questionImage = questionSection.querySelector("img.question-image");
    if (!questionImage) {
      questionImage = document.createElement("img");
      questionImage.className = "question-image hidden";
      questionSection.insertBefore(questionImage, questionText);
    }
    // Graceful fallback: if an image fails to load, hide it instead of
    // showing a broken-image icon (questions stay readable).
    questionImage.addEventListener("error", () => {
      questionImage.classList.add("hidden");
      questionImage.removeAttribute("src");
    });

    // Create/reuse the progress indicator at the top of the quiz card.
    const quizContainer = document.querySelector(".quiz-container") || document.body;
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
    bindNav();
    loadQuestion();

    function updateProgress() {
      const n = currentQuestionIndex + 1;
      const total = questions.length || 1;
      const pct = Math.round((n / total) * 100);
      if (qCurrent) qCurrent.textContent = String(n);
      if (qPct)     qPct.textContent = pct + "%";
      if (qFill)    qFill.style.width = pct + "%";
      progress.setAttribute("aria-valuenow", String(n));
    }

    // --- Functions ---

    function loadQuestion() {
      const q = questions[currentQuestionIndex];

      updateProgress();

      // Image (optional)
      if (q.image) {
        questionImage.src = q.image;
        questionImage.alt = q.alt || "";
        questionImage.classList.remove("hidden");
      } else {
        questionImage.classList.add("hidden");
        questionImage.removeAttribute("src");
        questionImage.removeAttribute("alt");
      }

      // Text & reset UI (strip any stale leading "1." / "12)" numbering)
      questionText.innerHTML = stripLeadingNumber(q.question);
      optionsList.innerHTML  = "";
      hide(feedbackDiv);
      hide(explanationDiv);
      hide(nextBtn);
      answered = false;
      unlockNext();

      // Build options in original order (no shuffle)
      (q.options || []).forEach((opt, idx) => {
        const li = document.createElement("li");
        li.className = "mcq-option";
        li.innerHTML = `
          <span class="option-label">${optionLabels[idx] || ""}.</span>
          <span class="option-text">${opt}</span>
          <span class="icon" id="icon-${idx}" aria-hidden="true"></span>
        `;
        li.onclick = () => checkAnswer(li, opt, q.correct, `icon-${idx}`);
        optionsList.appendChild(li);
      });
    }

    function checkAnswer(selectedLI, chosen, correct, iconId) {
      if (answered) return;                 // ignore repeat taps / double submits
      answered = true;
      // Disable further clicks
      optionsList.querySelectorAll("li").forEach(li => li.onclick = null);

      const isCorrect = (chosen === correct);
      let messageText, messageColor, rainEmoji;

      if (isCorrect) {
        correctCount++;
        selectedLI.classList.add("correct");
        setIcon(iconId, "check");
        messageText  = "Well done ❤️";
        messageColor = "green";
        rainEmoji    = "❤️";
      } else {
        selectedLI.classList.add("incorrect");
        setIcon(iconId, "cross");
        messageText  = "Oops, try again 😢";
        messageColor = "red";
        rainEmoji    = "😭";

        // Reveal the correct option
        optionsList.querySelectorAll("li").forEach((li, idx) => {
          const txt = li.querySelector(".option-text")?.textContent;
          if (txt === correct) {
            li.classList.add("correct");
            setIcon(`icon-${idx}`, "check");
          }
        });
      }

      // Feedback + Explanation
      feedbackDiv.innerHTML = `<span>${messageText}</span>`;
      feedbackDiv.style.color = messageColor;
      show(feedbackDiv);

      const exp = questions[currentQuestionIndex].explanation || "";
      explanationDiv.innerHTML = exp ? `<strong>Solution:</strong><br>${exp}` : "";
      toggle(explanationDiv, !!exp);

      // Reveal Next, but keep it locked until the celebration finishes so
      // kids can't spam-tap ahead or stack overlapping effects.
      show(nextBtn);
      lockNext();
      addEmojiRain(rainEmoji, 16, unlockNext);
    }

    function setIcon(iconId, type) {
      const el = document.getElementById(iconId);
      if (!el) return;
      if (type === "check") {
        el.innerHTML = "✔️";
        el.style.color = "#28a745";
      } else {
        el.innerHTML = "✖️";
        el.style.color = "#dc3545";
      }
    }

    function bindNav() {
      nextBtn.addEventListener("click", () => {
        if (nextLocked) return;             // celebration still playing
        currentQuestionIndex++;
        if (currentQuestionIndex < questions.length) {
          loadQuestion();
        } else {
          showCompletionScreen();
        }
      });
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

    // --- Completion Screen (fixed) ---
    function showCompletionScreen() {
      const total = questions.length;

      // Quiz finished: hide the progress bar.
      if (progress) progress.classList.add("hidden");

      // Replace the question area with completion content
      questionText.innerHTML = `
        <div class="completion-message" style="text-align:center; padding:2rem;">
          <h2>🎉 Quiz Completed! 🎉</h2>
          <p style="font-size:1.4rem; margin:1rem 0;">
            Your Score: <strong>${correctCount} / ${total}</strong>
          </p>
          <button id="home-btn" class="btn-home">Home</button>
        </div>
      `;

      // Clear options & hide feedback/explanation
      optionsList.innerHTML   = "";
      feedbackDiv.textContent = "";
      hide(feedbackDiv);
      explanationDiv.textContent = "";
      hide(explanationDiv);

      // Hide nav button (Back no longer exists)
      nextBtn.style.display = "none";

      // Optional: hide image if visible
      questionImage.classList.add("hidden");

      // Home button: try header link, else /index.html
      const homeBtn = document.getElementById("home-btn");
      if (homeBtn) {
        homeBtn.addEventListener("click", () => {
          const headerHome =
            document.querySelector(".logo-link") ||
            document.querySelector(".site-header .logo a") ||
            document.querySelector('nav a[href$="index.html"]');

          const href = headerHome?.getAttribute("href") || (window.base || "/") + "index.html";
          location.href = href;
        });
      }
    }

    // --- Small DOM helpers ---
    function show(el)   { el.classList.remove("hidden"); }
    function hide(el)   { el.classList.add("hidden"); }
    function toggle(el, on) { el.classList.toggle("hidden", !on); }
  };
})();

/* ================================
   Strip a stale leading list-marker from question text, e.g.
   "61. what color is the grass" -> "what color is the grass".
   Only removes an unambiguous marker at the very start; never touches
   numbers that are part of the question (math, "3 - 1", etc.).
   ================================ */
function stripLeadingNumber(text) {
  if (typeof text !== "string") return text;
  return text
    .replace(/^\s*\d{1,3}\s*[.):]\s+/, "")        // "1. "  "12) "  "3: "
    .replace(/^\s*\d{1,3}\s+-\s+(?=\D)/, "");      // "3 - x" but NOT "3 - 1"
}

/* ================================
   Emoji Rain (unchanged visuals)
   ================================ */
function addEmojiRain(emoji, count = 16, onComplete) {
  // Replace any in-flight celebration so effects never stack up.
  const old = document.getElementById("emoji-rain");
  if (old) old.remove();

  const container = document.createElement("div");
  container.id = "emoji-rain";
  document.body.appendChild(container);

  const DUR_MIN = 1.0, DUR_RANGE = 0.7;     // 1.0–1.7s fall
  const DELAY_RANGE = 0.25;                 // 0–0.25s stagger
  let maxEnd = 0;

  for (let i = 0; i < count; i++) {
    const drop = document.createElement("div");
    drop.className = "emoji-drop";
    drop.textContent = emoji;

    const dur = DUR_MIN + Math.random() * DUR_RANGE;
    const delay = Math.random() * DELAY_RANGE;
    maxEnd = Math.max(maxEnd, dur + delay);

    drop.style.left              = `${5 + Math.random() * 80}%`;
    drop.style.fontSize          = `${2.4 + Math.random() * 1.4}rem`;
    drop.style.animationDuration = `${dur}s`;
    drop.style.animationDelay    = `${delay}s`;

    container.appendChild(drop);
    drop.addEventListener("animationend", () => drop.remove());
  }

  // Fire onComplete once the whole celebration window has elapsed.
  const totalMs = Math.round(maxEnd * 1000) + 60;
  setTimeout(() => {
    container.remove();
    if (typeof onComplete === "function") onComplete();
  }, totalMs);
}
