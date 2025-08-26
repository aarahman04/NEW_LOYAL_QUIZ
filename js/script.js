let timerInterval;     // To store the interval ID
let timeLeft = 10;     // Starting time (seconds)
let currentQuestionIndex = 0;

// Elements
const questionText   = document.getElementById("question-text");
const optionsList    = document.getElementById("options-list");
const feedbackDiv    = document.getElementById("feedback");
const explanationDiv = document.getElementById("explanation");
const nextBtn        = document.getElementById("next-btn");
const backBtn        = document.getElementById("back-btn");
const optionLabels   = ["A", "B", "C", "D"];

// ▶️ CREATE a single <img> slot and stick it above the question text
const questionSection = document.querySelector(".question-section");
const questionImage   = document.createElement("img");
questionImage.className = "question-image hidden";  // hidden by default
questionSection.insertBefore(questionImage, questionText);

// -------------------- Quiz Logic --------------------

loadQuestion();

function loadQuestion() {
  const question = questions[currentQuestionIndex];

  // ——— HANDLE IMAGE ———
  if (question.image) {
    questionImage.src = question.image;
    questionImage.alt = question.alt || "";
    questionImage.classList.remove("hidden");
  } else {
    questionImage.classList.add("hidden");
  }

  // show back button only after Q1
  if (currentQuestionIndex > 0) backBtn.classList.remove("hidden");
  else backBtn.classList.add("hidden");
  
  questionText.innerHTML   = question.question;
  optionsList.innerHTML    = "";
  feedbackDiv.classList.add("hidden");
  explanationDiv.classList.add("hidden");
  nextBtn.classList.add("hidden");
  backBtn.classList.remove("hidden");

  question.options.forEach((opt, idx) => {
    const li = document.createElement("li");
    li.innerHTML = `
      <span class="option-label">${optionLabels[idx]}.</span>
      <span class="option-text">${opt}</span>
      <svg class="icon" id="icon-${idx}" xmlns="http://www.w3.org/2000/svg"></svg>
    `;
    li.onclick = () => checkAnswer(li, opt, question.correct, `icon-${idx}`);
    optionsList.appendChild(li);
  });
}

function checkAnswer(selectedOption, chosen, correct, iconId) {
  // disable further clicks
  document.querySelectorAll("#options-list li").forEach(li => li.onclick = null);

  let messageText, messageColor, messageEmoji;
  if (chosen === correct) {
    selectedOption.classList.add("correct");
    setIcon(iconId, "check");
    messageText = "Well done❤️";
    messageColor = "green";
    messageEmoji = "❤️";
  } else {
    selectedOption.classList.add("incorrect");
    setIcon(iconId, "cross");
    messageText = "Oops, try again 😢";
    messageColor = "red";
    messageEmoji = "😭";

    // reveal correct
    document.querySelectorAll("#options-list li").forEach((li, idx) => {
      if (li.querySelector(".option-text").textContent === correct) {
        li.classList.add("correct");
        setIcon(`icon-${idx}`, "check");
      }
    });
  }

  // show feedback message
  feedbackDiv.innerHTML = `<span>${messageText}</span>`;
  feedbackDiv.style.color = messageColor;
  feedbackDiv.classList.remove("hidden");

  // show explanation
  explanationDiv.innerHTML = `<strong>Solution:</strong><br>${questions[currentQuestionIndex].explanation}`;
  explanationDiv.classList.remove("hidden");

  // next button & emoji rain
  nextBtn.classList.remove("hidden");
  addEmojiRain(messageEmoji, 20);
}

function setIcon(iconId, type) {
  const icon = document.getElementById(iconId);
  if (type === "check") {
    icon.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
        <path fill="#28a745" d="M256 512A256..."/>
      </svg>
    `;
  } else {
    icon.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
        <path fill="#dc3545" d="M256 512A256..."/>
      </svg>
    `;
  }
}

(() => {
  let currentQuestionIndex = 0;
  let correctCount = 0;  // ← track correct answers

  // Elements (re-select inside IIFE)
  const questionText   = document.getElementById("question-text");
  const optionsList    = document.getElementById("options-list");
  const feedbackDiv    = document.getElementById("feedback");
  const explanationDiv = document.getElementById("explanation");
  const nextBtn        = document.getElementById("next-btn");
  const backBtn        = document.getElementById("back-btn");
  const optionLabels   = ["A", "B", "C", "D"];

  // -------------------- Quiz Logic --------------------
  loadQuestion();

  function loadQuestion() {
    const question = questions[currentQuestionIndex];

    // ——— HANDLE IMAGE ———
    if (question.image) {
      questionImage.src = question.image;
      questionImage.alt = question.alt || "";
      questionImage.classList.remove("hidden");
    } else {
      questionImage.classList.add("hidden");
    }

    questionText.innerHTML   = question.question;
    optionsList.innerHTML    = "";
    feedbackDiv.classList.add("hidden");
    explanationDiv.classList.add("hidden");
    nextBtn.classList.add("hidden");
    backBtn.classList.remove("hidden");

    question.options.forEach((opt, idx) => {
      const li = document.createElement("li");
      li.innerHTML = `
        <span class="option-label">${optionLabels[idx]}.</span>
        <span class="option-text">${opt}</span>
        <svg class="icon" id="icon-${idx}" xmlns="http://www.w3.org/2000/svg"></svg>
      `;
      li.onclick = () => checkAnswer(li, opt, question.correct, `icon-${idx}`);
      optionsList.appendChild(li);
    });
  }

  function checkAnswer(selectedOption, chosen, correct, iconId) {
    document.querySelectorAll("#options-list li").forEach(li => li.onclick = null);

    let messageText, messageColor, messageEmoji;
    if (chosen === correct) {
      correctCount++;
      selectedOption.classList.add("correct");
      setIcon(iconId, "check");
      messageText = "Well done ❤️";
      messageColor = "green";
      messageEmoji = "❤️";
    } else {
      selectedOption.classList.add("incorrect");
      setIcon(iconId, "cross");
      messageText = "Oops, try again 😢";
      messageColor = "red";
      messageEmoji = "😭";

      document.querySelectorAll("#options-list li").forEach((li, idx) => {
        if (li.querySelector(".option-text").textContent === correct) {
          li.classList.add("correct");
          setIcon(`icon-${idx}`, "check");
        }
      });
    }

    feedbackDiv.innerHTML = `<span>${messageText}</span>`;
    feedbackDiv.style.color = messageColor;
    feedbackDiv.classList.remove("hidden");

    explanationDiv.innerHTML = `<strong>Solution:</strong><br>${questions[currentQuestionIndex].explanation}`;
    explanationDiv.classList.remove("hidden");

    nextBtn.classList.remove("hidden");
    addEmojiRain(messageEmoji, 20);
  }

  // -------------------- Navigation --------------------
  nextBtn.addEventListener("click", loadNextQuestion);
  backBtn.addEventListener("click", loadPreviousQuestion);

  function loadNextQuestion() {
    currentQuestionIndex++;
    if (currentQuestionIndex < questions.length) {
      loadQuestion();
    } else {
      showCompletionScreen();
    }
  }

  function loadPreviousQuestion() {
    if (currentQuestionIndex > 0) {
      currentQuestionIndex--;
      loadQuestion();
    }
  }

  // -------------------- Completion Screen --------------------
  function showCompletionScreen() {
    const total = questions.length;
    questionText.innerHTML = `
      <div class="completion-message" style="text-align:center; padding:2rem;">
        <h2>🎉 Quiz Completed! 🎉</h2>
        <p style="font-size:1.4rem; margin:1rem 0;">
          Your Score: <strong>${correctCount} / ${total}</strong>
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
})();

// -------------------- Emoji Rain --------------------
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

    const leftPercent = 5 + Math.random() * 70;
    drop.style.left              = `${leftPercent}%`;
    drop.style.fontSize          = "5rem";
    drop.style.animationDuration = (2 + Math.random() * 3) + "s";
    drop.style.animationDelay    = Math.random() * 1 + "s";

    container.appendChild(drop);
    drop.addEventListener("animationend", () => drop.remove());
  }

  setTimeout(() => {
    if (container.childElementCount === 0) container.remove();
  }, 5000);
}
