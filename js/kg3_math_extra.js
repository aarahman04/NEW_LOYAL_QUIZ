/* ============================================================
   kg3_math_extra.js — helper for the six newer KG-3 math pages.
   Exposes: window.kg3MathStart(questions)

   Shows the page's how-to-play card (#kg3-intro) first, then hands
   the bank to the shared tap-select engine. Also keeps keyboard
   users in the flow: after an answer focus moves to Next, and on a
   new question it moves to the first tile. The engine itself
   (js/tap_select.js) is untouched.
   ============================================================ */
;(function () {
  "use strict";

  let keyboard = false;   // focus only moves for keyboard users, so taps never jump the page
  document.addEventListener("keydown", () => { keyboard = true; }, true);
  document.addEventListener("pointerdown", () => { keyboard = false; }, true);

  // New tiles can appear right under a finger that just tapped Start or Next; the
  // second tap of a double tap must not answer the new question.
  let guardUntil = 0;
  document.addEventListener("click", (e) => {
    if (e.detail > 0 && Date.now() < guardUntil && e.target.closest && e.target.closest("#tap-grid")) {
      e.stopPropagation();
      e.preventDefault();
    }
  }, true);
  const guard = () => { guardUntil = Date.now() + 450; };

  window.kg3MathStart = function kg3MathStart(questions) {
    const main = document.querySelector(".quiz-container");
    const intro = document.getElementById("kg3-intro");
    const startBtn = document.getElementById("kg3-start-btn");
    let started = false;

    function start() {
      if (started) return;              // double tap on Start
      started = true;
      if (intro) intro.remove();
      main.classList.remove("kg3-intro-open");
      guard();
      window.initTapSelectQuiz(questions);
      followFocus();
      focusFirstTile();
    }

    if (!intro || !startBtn) return start();
    startBtn.addEventListener("click", start);
  };

  function focusFirstTile() {
    const tile = document.querySelector("#tap-grid .tap-tile");
    if (keyboard && tile) tile.focus();
  }

  function followFocus() {
    const grid = document.getElementById("tap-grid");
    const next = document.getElementById("next-btn");
    // Answered -> the engine adds .locked to the grid; new question -> it rebuilds the
    // tiles; finished -> it empties the grid and shows a Home button.
    new MutationObserver((records) => {
      if (records.some((r) => r.type === "childList")) guard();
      if (!keyboard) return;
      const home = document.getElementById("home-btn");
      if (home) home.focus();
      else if (grid.classList.contains("locked")) next.focus();
      else focusFirstTile();
    }).observe(grid, { attributes: true, attributeFilter: ["class"], childList: true });
  }
})();
