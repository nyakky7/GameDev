const directions = ["lane0", "lane1", "lane2", "lane3"]; // ← 修正済み
const keyMap = {
  KeyZ: "lane0",
  KeyX: "lane1",
  KeyC: "lane2",
  KeyV: "lane3"
};

let chart = [];
let notes = [];
let score = 0;
let combo = 0;
let maxCombo = 0;
const noteFallTime = 2;

let perfect = 0;
let good = 0;
let bad = 0;
let miss = 0;

let gameStarted = false;
let countdownStarted = false;

document.addEventListener("keydown", e => {
  if (e.code === "Space" && !gameStarted && !countdownStarted) {
    countdownStarted = true;
    const countdown = document.getElementById("countdown");
    countdown.style.display = "block";
    let count = 3;
    countdown.textContent = count;

    const timer = setInterval(() => {
      count--;
      if (count > 0) {
        countdown.textContent = count;
      } else {
        clearInterval(timer);
        countdown.style.display = "none";

        const bgVideo = document.getElementById("bgVideo");
        bgVideo.play();

        gameStarted = true;
        startGame();
      }
    }, 1000);
    return;
  }

  if (!gameStarted) return;

  const lane = keyMap[e.code];
  if (!lane) return;

  const judgeBarY = 80;
  const judgeRange = 15;

  for (let i = 0; i < notes.length; i++) {
    const note = notes[i];
    if (note.lane !== lane) continue;

    const now = document.getElementById("bgm").currentTime;
    const t = note.hitTime - now;
    const y = (1 - t / noteFallTime) * 100;

    const diff = Math.abs(y - judgeBarY);

    if (diff <= judgeRange) {
      if (diff <= 5) {
        perfect++;
        combo++;
        score += 1000;
      } else if (diff <= 10) {
        good++;
        combo++;
        score += 500;
      } else {
        bad++;
        combo = 0;
        score += 100;
      }

      note.el.remove();
      notes.splice(i, 1);
      updateCombo();
      updateJudgeCounts();
      showRipple(document.querySelector(`.${lane}`));
      flashJudgeBar();
      return;
    }
  }

  showRipple(document.querySelector(`.${lane}`));
  flashJudgeBar();
});

fetch("chart.json")
  .then(res => res.json())
  .then(data => {
    chart = data.notes.map(note => ({
      time: note.time - noteFallTime,
      lane: directions[note.lane],
      hitTime: note.time
    }));
  });

function startGame() {
  const bgm = document.getElementById("bgm");
  bgm.currentTime = 0;
  bgm.play();
  requestAnimationFrame(gameLoop);
  setInterval(moveNotes, 16);
}

function gameLoop() {
  const current = document.getElementById("bgm").currentTime;
  while (chart.length > 0 && chart[0].time <= current) {
    const note = chart.shift();
    spawnNote(note.lane, note.hitTime);
  }
  requestAnimationFrame(gameLoop);
}

function spawnNote(lane, hitTime) {
  const el = document.createElement("div");
  el.className = "note";
  el.style.top = "0%";
  document.querySelector(`.${lane}`).appendChild(el);
  notes.push({ el, lane, hitTime });
}

function moveNotes() {
  const now = document.getElementById("bgm").currentTime;
  for (let i = notes.length - 1; i >= 0; i--) {
    const note = notes[i];
    const t = note.hitTime - now;
    const y = (1 - t / noteFallTime) * 100;
    if (y > 100) {
      note.el.remove();
      notes.splice(i, 1);
      combo = 0;
      miss++;
      updateCombo();
      updateJudgeCounts();
    } else {
      note.el.style.top = `${y}%`;
    }
  }
}

function updateCombo() {
  document.getElementById("comboDisplay").textContent = `COMBO: ${combo}`;
  document.getElementById("scoreDisplay").textContent = `SCORE: ${score}`;
  if (combo > maxCombo) maxCombo = combo;
  document.getElementById("maxComboDisplay").textContent = `MAX COMBO: ${maxCombo}`;
}

function updateJudgeCounts() {
  document.getElementById("perfectCount").textContent = perfect;
  document.getElementById("goodCount").textContent = good;
  document.getElementById("badCount").textContent = bad;
  document.getElementById("missCount").textContent = miss;
}

function showRipple(lane) {
  const ripple = document.createElement("div");
  ripple.className = "ripple-ring";

  const game = document.getElementById("game");
  game.appendChild(ripple);

  const laneRect = lane.getBoundingClientRect();
  const gameRect = game.getBoundingClientRect();
  const centerX = laneRect.left + laneRect.width / 2 - gameRect.left;

  ripple.style.left = `${centerX}px`;

  setTimeout(() => ripple.remove(), 600);
}

function flashJudgeBar() {
  const bar = document.getElementById("customJudgeBar");
  if (!bar) return;
  bar.style.borderTopColor = "cyan";
  setTimeout(() => {
    bar.style.borderTopColor = "white";
  }, 100);
}
