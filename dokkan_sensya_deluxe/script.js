const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const overlay = document.getElementById('overlay');
const titlePanel = document.getElementById('title-panel');
const resultPanel = document.getElementById('result-panel');
const resultTitle = document.getElementById('result-title');
const resultMessage = document.getElementById('result-message');
const startButton = document.getElementById('start-button');
const retryButton = document.getElementById('retry-button');
const scoreEl = document.getElementById('score');
const comboEl = document.getElementById('combo');
const timeFill = document.getElementById('time-fill');
const dokkanFill = document.getElementById('dokkan-fill');

const config = {
  baseTime: 70,
  extraTimePerCombo: 0.15,
  dirtCount: 120,
  dirtRadius: [16, 48],
  sprayRadius: [38, 64],
  sprayStrength: 0.8,
  dokkanChargePerClean: 0.016,
  dokkanDuration: 5.5,
  dokkanBonus: 1.8,
};

const state = {
  phase: 'title',
  score: 0,
  combo: 0,
  bestCombo: 0,
  timeLeft: config.baseTime,
  lastCleanTime: 0,
  dokkanGauge: 0,
  dokkanTime: 0,
  dirtSpots: [],
  foam: [],
  waterRipples: [],
  pointer: { active: false, x: 0, y: 0, radius: 48, intensity: 0 },
  viewWidth: canvas.width,
  viewHeight: canvas.height,
  dpr: window.devicePixelRatio || 1,
};

let lastTimestamp = performance.now();

function resizeCanvas() {
  const dpr = window.devicePixelRatio || 1;
  const rectWidth = Math.min(window.innerWidth * 0.96, 980);
  const rectHeight = Math.min(window.innerHeight * 0.58, 560);

  canvas.width = rectWidth * dpr;
  canvas.height = rectHeight * dpr;
  canvas.style.width = `${rectWidth}px`;
  canvas.style.height = `${rectHeight}px`;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  state.viewWidth = rectWidth;
  state.viewHeight = rectHeight;
  state.dpr = dpr;
}

resizeCanvas();
window.addEventListener('resize', resizeCanvas);

function randomBetween([min, max]) {
  return Math.random() * (max - min) + min;
}

function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

function resetGame() {
  state.phase = 'playing';
  state.score = 0;
  state.combo = 0;
  state.bestCombo = 0;
  state.timeLeft = config.baseTime;
  state.lastCleanTime = 0;
  state.dokkanGauge = 0;
  state.dokkanTime = 0;
  state.dirtSpots = generateDirt();
  state.foam = [];
  state.waterRipples = [];
  state.pointer.active = false;
  state.pointer.intensity = 0;
}

function generateDirt() {
  const { viewWidth: width, viewHeight: height } = state;
  const carBounds = {
    x: width * 0.12,
    y: height * 0.32,
    width: width * 0.76,
    height: height * 0.42,
  };

  const spots = [];
  for (let i = 0; i < config.dirtCount; i += 1) {
    const radius = randomBetween(config.dirtRadius);
    const x = carBounds.x + Math.random() * carBounds.width;
    const y = carBounds.y + (Math.random() ** 0.6) * carBounds.height;
    const strength = 0.6 + Math.random() * 0.8;
    spots.push({ x, y, radius, strength, remaining: strength });
  }
  return spots;
}

function setOverlay(visible, panel) {
  if (visible) {
    overlay.classList.remove('hidden');
    titlePanel.hidden = panel !== 'title';
    resultPanel.hidden = panel !== 'result';
  } else {
    overlay.classList.add('hidden');
  }
}

startButton.addEventListener('click', () => {
  resetGame();
  setOverlay(false);
});

retryButton.addEventListener('click', () => {
  resetGame();
  setOverlay(false);
});

canvas.addEventListener('pointerdown', (event) => {
  if (state.phase !== 'playing') return;
  canvas.setPointerCapture(event.pointerId);
  updatePointer(event);
  state.pointer.active = true;
});

canvas.addEventListener('pointerup', (event) => {
  if (state.phase !== 'playing') return;
  canvas.releasePointerCapture(event.pointerId);
  state.pointer.active = false;
  state.pointer.intensity = 0;
});

canvas.addEventListener('pointerleave', () => {
  state.pointer.active = false;
  state.pointer.intensity = 0;
});

canvas.addEventListener('pointermove', (event) => {
  if (state.phase !== 'playing') return;
  updatePointer(event);
});

function updatePointer(event) {
  const rect = canvas.getBoundingClientRect();
  state.pointer.x = event.clientX - rect.left;
  state.pointer.y = event.clientY - rect.top;
  state.pointer.radius = randomBetween(config.sprayRadius);
  if (state.pointer.active) {
    state.pointer.intensity = Math.min(1, state.pointer.intensity + 0.08);
  }
}

function update(dt) {
  if (state.phase !== 'playing') return;

  state.timeLeft = Math.max(0, state.timeLeft - dt);
  if (state.timeLeft === 0 || state.dirtSpots.length === 0) {
    endGame();
    return;
  }

  if (state.dokkanTime > 0) {
    state.dokkanTime = Math.max(0, state.dokkanTime - dt);
  }

  if (state.pointer.active) {
    sprayWater(dt);
  } else {
    state.pointer.intensity = Math.max(0, state.pointer.intensity - dt * 2);
  }

  updateFoam(dt);
  updateRipples(dt);
}

function sprayWater(dt) {
  const { x, y, radius, intensity } = state.pointer;
  const brushRadius = radius * (0.7 + intensity * 0.6);
  const brushStrength = config.sprayStrength * (1 + intensity) * (state.dokkanTime > 0 ? config.dokkanBonus : 1);

  let cleanedSomething = false;
  for (let i = state.dirtSpots.length - 1; i >= 0; i -= 1) {
    const spot = state.dirtSpots[i];
    const dx = spot.x - x;
    const dy = spot.y - y;
    const dist = Math.hypot(dx, dy);
    const influence = brushRadius + spot.radius * 0.6;
    if (dist < influence) {
      const falloff = 1 - dist / influence;
      const scrub = brushStrength * (0.45 + falloff * 0.8) * dt;
      spot.remaining = Math.max(0, spot.remaining - scrub);
      if (spot.remaining === 0) {
        state.dirtSpots.splice(i, 1);
        state.score += Math.round(80 + Math.random() * 40 + state.combo * 4);
        cleanedSomething = true;
        state.dokkanGauge = Math.min(1, state.dokkanGauge + config.dokkanChargePerClean);
        if (state.dokkanGauge === 1 && state.dokkanTime === 0) {
          state.dokkanTime = config.dokkanDuration;
          state.dokkanGauge = 0;
          addRipple(x, y, true);
        }
      } else {
        cleanedSomething = true;
      }
      addFoam(x + dx * 0.2, y + dy * 0.2, Math.max(spot.radius * 0.2, 12));
    }
  }

  if (cleanedSomething) {
    const now = performance.now();
    if (now - state.lastCleanTime < 1200) {
      state.combo += 1;
      state.bestCombo = Math.max(state.bestCombo, state.combo);
      state.timeLeft = Math.min(config.baseTime, state.timeLeft + config.extraTimePerCombo);
    } else {
      state.combo = 1;
    }
    state.lastCleanTime = now;
    addRipple(x, y, state.dokkanTime > 0);
  } else if (performance.now() - state.lastCleanTime > 1600) {
    state.combo = 0;
  }
}

function endGame() {
  state.phase = 'result';
  resultTitle.textContent = state.dirtSpots.length === 0 ? 'ピカピカ！' : '時間切れ';
  const cleaned = config.dirtCount - state.dirtSpots.length;
  const percentage = Math.round((cleaned / config.dirtCount) * 100);
  resultMessage.textContent = `洗浄率 ${percentage}% / ベスト連続 ${state.bestCombo} コンボ / スコア ${state.score.toLocaleString('ja-JP')}`;
  setOverlay(true, 'result');
}

function updateFoam(dt) {
  for (let i = state.foam.length - 1; i >= 0; i -= 1) {
    const bubble = state.foam[i];
    bubble.life -= dt;
    bubble.y -= dt * 18;
    bubble.radius += dt * 6;
    if (bubble.life <= 0) {
      state.foam.splice(i, 1);
    }
  }
}

function addFoam(x, y, radius) {
  for (let i = 0; i < 3; i += 1) {
    state.foam.push({
      x: x + (Math.random() - 0.5) * radius * 1.4,
      y: y + (Math.random() - 0.5) * radius * 0.6,
      radius: radius * (0.6 + Math.random() * 0.5),
      life: 0.6 + Math.random() * 0.4,
    });
  }
}

function addRipple(x, y, dokkan) {
  state.waterRipples.push({
    x,
    y,
    radius: 10,
    life: dokkan ? 0.5 : 0.35,
    age: 0,
    dokkan,
  });
}

function updateRipples(dt) {
  for (let i = state.waterRipples.length - 1; i >= 0; i -= 1) {
    const ripple = state.waterRipples[i];
    ripple.age += dt;
    ripple.radius += dt * (ripple.dokkan ? 360 : 220);
    if (ripple.age > ripple.life) {
      state.waterRipples.splice(i, 1);
    }
  }
}

function drawBackground() {
  const { viewWidth: width, viewHeight: height } = state;

  const gradient = ctx.createLinearGradient(0, 0, width * 0.3, height);
  gradient.addColorStop(0, '#0b1b2f');
  gradient.addColorStop(1, '#02060a');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = 'rgba(10, 20, 34, 0.9)';
  ctx.fillRect(width * 0.05, height * 0.65, width * 0.9, height * 0.12);

  ctx.fillStyle = 'rgba(21, 43, 70, 0.7)';
  ctx.fillRect(width * 0.05, height * 0.77, width * 0.9, height * 0.05);
}

function drawCar() {
  const { viewWidth: width, viewHeight: height } = state;
  const centerY = height * 0.6;
  const carWidth = width * 0.72;
  const carHeight = height * 0.34;
  const startX = (width - carWidth) / 2;

  ctx.save();
  ctx.translate(startX, centerY - carHeight * 0.75);

  const carBodyGradient = ctx.createLinearGradient(0, 0, 0, carHeight);
  carBodyGradient.addColorStop(0, '#2e8fff');
  carBodyGradient.addColorStop(0.6, '#0b3c7a');
  carBodyGradient.addColorStop(1, '#071c3a');

  ctx.fillStyle = carBodyGradient;
  ctx.beginPath();
  ctx.moveTo(carWidth * 0.05, carHeight * 0.75);
  ctx.quadraticCurveTo(carWidth * 0.12, carHeight * 0.2, carWidth * 0.36, carHeight * 0.12);
  ctx.quadraticCurveTo(carWidth * 0.48, carHeight * 0.04, carWidth * 0.64, carHeight * 0.12);
  ctx.quadraticCurveTo(carWidth * 0.88, carHeight * 0.2, carWidth * 0.95, carHeight * 0.72);
  ctx.lineTo(carWidth * 0.95, carHeight * 0.9);
  ctx.quadraticCurveTo(carWidth * 0.8, carHeight * 1.05, carWidth * 0.7, carHeight * 1.05);
  ctx.lineTo(carWidth * 0.28, carHeight * 1.05);
  ctx.quadraticCurveTo(carWidth * 0.16, carHeight * 1.05, carWidth * 0.05, carHeight * 0.9);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
  ctx.beginPath();
  ctx.moveTo(carWidth * 0.2, carHeight * 0.3);
  ctx.quadraticCurveTo(carWidth * 0.36, carHeight * 0.12, carWidth * 0.52, carHeight * 0.28);
  ctx.lineTo(carWidth * 0.72, carHeight * 0.36);
  ctx.quadraticCurveTo(carWidth * 0.52, carHeight * 0.52, carWidth * 0.24, carHeight * 0.52);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#111a28';
  ctx.beginPath();
  ctx.arc(carWidth * 0.25, carHeight * 1.02, carHeight * 0.25, 0, Math.PI * 2);
  ctx.arc(carWidth * 0.75, carHeight * 1.02, carHeight * 0.25, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#d9e6ef';
  ctx.beginPath();
  ctx.arc(carWidth * 0.25, carHeight * 1.02, carHeight * 0.15, 0, Math.PI * 2);
  ctx.arc(carWidth * 0.75, carHeight * 1.02, carHeight * 0.15, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = 'rgba(255, 255, 255, 0.18)';
  ctx.fillRect(carWidth * 0.64, carHeight * 0.7, carWidth * 0.18, carHeight * 0.18);

  ctx.restore();
}

function drawDirt() {
  ctx.save();
  ctx.globalCompositeOperation = 'multiply';
  for (const spot of state.dirtSpots) {
    const alpha = easeOutCubic(spot.remaining / spot.strength);
    const grad = ctx.createRadialGradient(spot.x, spot.y, spot.radius * 0.1, spot.x, spot.y, spot.radius);
    grad.addColorStop(0, `rgba(92, 62, 32, ${0.75 * alpha})`);
    grad.addColorStop(1, `rgba(32, 20, 12, ${0.05 * alpha})`);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(spot.x, spot.y, spot.radius, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawFoam() {
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (const bubble of state.foam) {
    const alpha = bubble.life / 1.1;
    const gradient = ctx.createRadialGradient(
      bubble.x,
      bubble.y,
      bubble.radius * 0.1,
      bubble.x,
      bubble.y,
      bubble.radius
    );
    gradient.addColorStop(0, `rgba(255, 255, 255, ${0.9 * alpha})`);
    gradient.addColorStop(1, `rgba(230, 248, 255, 0)`);
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(bubble.x, bubble.y, bubble.radius, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawRipples() {
  ctx.save();
  ctx.lineWidth = 3;
  for (const ripple of state.waterRipples) {
    const lifeRatio = 1 - ripple.age / ripple.life;
    ctx.strokeStyle = ripple.dokkan
      ? `rgba(255, 186, 85, ${lifeRatio * 0.65})`
      : `rgba(130, 210, 255, ${lifeRatio * 0.6})`;
    ctx.beginPath();
    ctx.arc(ripple.x, ripple.y, ripple.radius, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

function drawPointer() {
  if (!state.pointer.active) return;
  ctx.save();
  const { x, y, radius, intensity } = state.pointer;
  const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius * 0.8);
  gradient.addColorStop(0, `rgba(120, 200, 255, ${0.2 + intensity * 0.4})`);
  gradient.addColorStop(1, 'rgba(120, 200, 255, 0)');
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(x, y, radius * 0.8, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawDokkanAura() {
  if (state.dokkanTime <= 0) return;
  const { viewWidth: width, viewHeight: height } = state;
  const intensity = easeOutCubic(state.dokkanTime / config.dokkanDuration);
  const gradient = ctx.createRadialGradient(
    width / 2,
    height * 0.55,
    width * 0.1,
    width / 2,
    height * 0.55,
    width * 0.6
  );
  gradient.addColorStop(0, `rgba(255, 196, 120, ${0.25 * intensity})`);
  gradient.addColorStop(1, 'rgba(255, 130, 40, 0)');
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
  ctx.restore();
}

function render() {
  drawBackground();
  drawDokkanAura();
  drawCar();
  drawDirt();
  drawFoam();
  drawRipples();
  drawPointer();

  scoreEl.textContent = state.score.toLocaleString('ja-JP');
  comboEl.textContent = state.combo;
  timeFill.style.transform = `scaleX(${state.timeLeft / config.baseTime})`;
  dokkanFill.style.transform = `scaleX(${state.dokkanTime > 0 ? 1 : state.dokkanGauge})`;
}

function loop(timestamp) {
  const dt = Math.min((timestamp - lastTimestamp) / 1000, 0.05);
  lastTimestamp = timestamp;

  update(dt);
  render();
  requestAnimationFrame(loop);
}

requestAnimationFrame(loop);

setOverlay(true, 'title');
