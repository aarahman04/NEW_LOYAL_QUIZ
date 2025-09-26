/* ================================
   MCQ Quiz (clean + fixed)
   ================================= */

(function () {
  // Public init
  window.initMCQQuiz = function initMCQQuiz(questions) {
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

    // Create/reuse single <img> above question text
    const questionSection = document.querySelector(".question-section") || document.body;
    let questionImage = questionSection.querySelector("img.question-image");
    if (!questionImage) {
      questionImage = document.createElement("img");
      questionImage.className = "question-image hidden";
      questionSection.insertBefore(questionImage, questionText);
    }

    // --- Boot ---
    bindNav();
    loadQuestion();

    // --- Functions ---

    function loadQuestion() {
      const q = questions[currentQuestionIndex];

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

      // Text & reset UI
      questionText.innerHTML = q.question;
      optionsList.innerHTML  = "";
      hide(feedbackDiv);
      hide(explanationDiv);
      hide(nextBtn);
      toggle(backBtn, currentQuestionIndex > 0);

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

      // Next button
      show(nextBtn);

      // Emoji rain (sad for wrong, hearts for correct)
      addEmojiRain(rainEmoji, isCorrect ? 20 : 20);
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
        currentQuestionIndex++;
        if (currentQuestionIndex < questions.length) {
          loadQuestion();
        } else {
          showCompletionScreen();
        }
      });

      backBtn.addEventListener("click", () => {
        if (currentQuestionIndex > 0) {
          currentQuestionIndex--;
          loadQuestion();
        }
      });
    }

    // --- Completion Screen (fixed) ---
    function showCompletionScreen() {
      const total = questions.length;

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

      // Hide nav buttons
      nextBtn.style.display = "none";
      backBtn.style.display = "none";

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
   Emoji Rain (unchanged visuals)
   ================================ */
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
    drop.style.fontSize          = "5rem";
    drop.style.animationDuration = `${2 + Math.random() * 3}s`;
    drop.style.animationDelay    = `${Math.random()}s`;

    container.appendChild(drop);
    drop.addEventListener("animationend", () => drop.remove());
  }

  setTimeout(() => {
    if (container.childElementCount === 0) container.remove();
  }, 5000);
}
