const gameArea = document.getElementById("gameArea");
const player = document.getElementById("player");
const levelText = document.getElementById("level");
const scoreText = document.getElementById("score");
const levelScoreText = document.getElementById("levelScore");
const missText = document.getElementById("miss");
const message = document.getElementById("message");
const startBtn = document.getElementById("startBtn");
const rankingList = document.getElementById("rankingList");
const resetRankingBtn = document.getElementById("resetRankingBtn");
const bgm = document.getElementById("bgm");
const touchLeftBtn = document.getElementById("touchLeftBtn");
const touchRightBtn = document.getElementById("touchRightBtn");

let playerX = 200;
let playerWidth = 100;

let fallingItems = [];

let level = 1;
let score = 0;
let levelScore = 0;
let miss = 0;
let finalResult = "";

let gameRunning = false;
let gameLoop;
let spawnLoop;

let moveLeft = false;
let moveRight = false;
let keyboardMoveLeft = false;
let keyboardMoveRight = false;
let touchMoveLeft = false;
let touchMoveRight = false;

const playerSpeed = 9;
const itemSize = 36;
const targetScorePerLevel = 20;
const maxMiss = 5;

const levelSettings = {
  1: {
    itemSpeed: 5,
    playerWidth: 100,
    badItemChance: 0.2,
    maxItems: 3,
    spawnDelay: 900,
    startItems: 2
  },
  2: {
    itemSpeed: 7,
    playerWidth: 80,
    badItemChance: 0.3,
    maxItems: 3,
    spawnDelay: 550,
    startItems: 3
  },
  3: {
    itemSpeed: 9,
    playerWidth: 60,
    badItemChance: 0.4,
    maxItems: 5,
    spawnDelay: 380,
    startItems: 4
  }
};

let audioContext;

function initAudio() {
  if (!audioContext) {
    audioContext = new AudioContext();
  }
}

function startBgm() {
  if (!bgm) return;

  bgm.volume = 0.25;
  bgm.currentTime = 0;

  bgm.play().catch(() => {
    console.log("브라우저 정책으로 인해 BGM 재생이 차단될 수 있습니다.");
  });
}

function stopBgm() {
  if (!bgm) return;

  bgm.pause();
  bgm.currentTime = 0;
}

function playSound(frequency, duration, type = "sine", volume = 0.2) {
  if (!audioContext) return;

  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscillator.type = type;
  oscillator.frequency.value = frequency;
  gainNode.gain.value = volume;

  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);

  oscillator.start();

  gainNode.gain.exponentialRampToValueAtTime(
    0.001,
    audioContext.currentTime + duration
  );

  oscillator.stop(audioContext.currentTime + duration);
}

function playCatchSound() {
  playSound(700, 0.08, "sine", 0.25);

  setTimeout(() => {
    playSound(950, 0.08, "sine", 0.2);
  }, 70);
}

function playMoveSound() {
  playSound(220, 0.04, "square", 0.04);
}

function playMissSound() {
  playSound(180, 0.12, "sawtooth", 0.18);

  setTimeout(() => {
    playSound(130, 0.12, "sawtooth", 0.16);
  }, 100);
}

function playBadCatchSound() {
  playSound(90, 0.18, "square", 0.25);
}

function playWinSound() {
  playSound(523, 0.12, "sine", 0.25);

  setTimeout(() => {
    playSound(659, 0.12, "sine", 0.25);
  }, 120);

  setTimeout(() => {
    playSound(784, 0.18, "sine", 0.3);
  }, 240);
}

function playLoseSound() {
  playSound(392, 0.18, "sawtooth", 0.2);

  setTimeout(() => {
    playSound(294, 0.18, "sawtooth", 0.2);
  }, 170);

  setTimeout(() => {
    playSound(196, 0.25, "sawtooth", 0.25);
  }, 340);
}

function playLevelUpSound() {
  playSound(500, 0.08, "triangle", 0.2);

  setTimeout(() => {
    playSound(750, 0.1, "triangle", 0.25);
  }, 90);
}

document.addEventListener("keydown", (event) => {
  if (event.key === "ArrowLeft") {
    keyboardMoveLeft = true;
    syncMoveFlags();
  }

  if (event.key === "ArrowRight") {
    keyboardMoveRight = true;
    syncMoveFlags();
  }
});

document.addEventListener("keyup", (event) => {
  if (event.key === "ArrowLeft") {
    keyboardMoveLeft = false;
    syncMoveFlags();
  }

  if (event.key === "ArrowRight") {
    keyboardMoveRight = false;
    syncMoveFlags();
  }
});

function syncMoveFlags() {
  moveLeft = keyboardMoveLeft || touchMoveLeft;
  moveRight = keyboardMoveRight || touchMoveRight;
}

function getGameWidth() {
  return gameArea.clientWidth;
}

function getGameHeight() {
  return gameArea.clientHeight;
}

function setTouchDirection(direction) {
  touchMoveLeft = direction === "left";
  touchMoveRight = direction === "right";
  syncMoveFlags();
  touchLeftBtn.classList.toggle("is-pressed", touchMoveLeft);
  touchRightBtn.classList.toggle("is-pressed", touchMoveRight);
}

function clearTouchDirection() {
  touchMoveLeft = false;
  touchMoveRight = false;
  syncMoveFlags();
  touchLeftBtn.classList.remove("is-pressed");
  touchRightBtn.classList.remove("is-pressed");
}

function resetInputState() {
  keyboardMoveLeft = false;
  keyboardMoveRight = false;
  touchMoveLeft = false;
  touchMoveRight = false;
  syncMoveFlags();
  touchLeftBtn.classList.remove("is-pressed");
  touchRightBtn.classList.remove("is-pressed");
}

function bindHoldButton(button, direction) {
  button.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    button.setPointerCapture(event.pointerId);
    setTouchDirection(direction);
  });

  button.addEventListener("pointerup", clearTouchDirection);
  button.addEventListener("pointercancel", clearTouchDirection);
  button.addEventListener("lostpointercapture", clearTouchDirection);
}

function setDirectionFromGameTouch(event) {
  if (event.target.closest("button, input")) return;

  const rect = gameArea.getBoundingClientRect();
  const direction = event.clientX < rect.left + rect.width / 2 ? "left" : "right";

  setTouchDirection(direction);
}

bindHoldButton(touchLeftBtn, "left");
bindHoldButton(touchRightBtn, "right");

gameArea.addEventListener("pointerdown", (event) => {
  if (event.target.closest("button, input")) return;

  event.preventDefault();
  gameArea.setPointerCapture(event.pointerId);
  setDirectionFromGameTouch(event);
});

gameArea.addEventListener("pointermove", (event) => {
  if (event.buttons === 1) {
    setDirectionFromGameTouch(event);
  }
});

gameArea.addEventListener("pointerup", clearTouchDirection);
gameArea.addEventListener("pointercancel", clearTouchDirection);
gameArea.addEventListener("lostpointercapture", clearTouchDirection);

window.addEventListener("resize", () => {
  const maxX = getGameWidth() - playerWidth;

  if (playerX > maxX) {
    playerX = Math.max(0, maxX);
    player.style.left = playerX + "px";
  }
});

window.addEventListener("blur", resetInputState);

startBtn.addEventListener("click", startGame);

resetRankingBtn.addEventListener("click", () => {
  localStorage.removeItem("fallingGameRanking");
  renderRanking();
});

function startGame() {
  initAudio();
  startBgm();

  level = 1;
  score = 0;
  levelScore = 0;
  miss = 0;
  finalResult = "";

  resetInputState();

  clearInterval(gameLoop);
  clearInterval(spawnLoop);

  removeAllItems();
  applyLevelSettings();

  scoreText.textContent = score;
  levelScoreText.textContent = levelScore;
  missText.textContent = miss;
  levelText.textContent = level;

  message.style.display = "none";

  gameRunning = true;

  createStartItems();
  startSpawnLoop();

  gameLoop = setInterval(updateGame, 20);
}

function applyLevelSettings() {
  playerWidth = levelSettings[level].playerWidth;
  playerX = (getGameWidth() - playerWidth) / 2;

  player.style.width = playerWidth + "px";
  player.style.left = playerX + "px";
}

function createStartItems() {
  for (let i = 0; i < levelSettings[level].startItems; i++) {
    createFallingItem(-50 - i * 120);
  }
}

function startSpawnLoop() {
  clearInterval(spawnLoop);

  spawnLoop = setInterval(() => {
    if (!gameRunning) return;

    if (fallingItems.length < levelSettings[level].maxItems) {
      createFallingItem();
    }
  }, levelSettings[level].spawnDelay);
}

function createFallingItem(startY = -50) {
  const itemElement = document.createElement("div");
  itemElement.classList.add("falling-item");

  const badItemChance = levelSettings[level].badItemChance;
  const itemType = Math.random() < badItemChance ? "bad" : "good";

  itemElement.textContent = itemType === "good" ? "🍎" : "💣";

  const itemX = Math.floor(Math.random() * Math.max(1, getGameWidth() - itemSize));
  const itemY = startY;

  itemElement.style.left = itemX + "px";
  itemElement.style.top = itemY + "px";

  gameArea.appendChild(itemElement);

  fallingItems.push({
    element: itemElement,
    x: itemX,
    y: itemY,
    type: itemType
  });
}

function updateGame() {
  movePlayer();

  for (let i = fallingItems.length - 1; i >= 0; i--) {
    const item = fallingItems[i];

    item.y += levelSettings[level].itemSpeed;
    item.element.style.top = item.y + "px";

    if (checkCatch(item)) {
      removeItem(i);
      continue;
    }

    if (item.y > getGameHeight()) {
      if (item.type === "good") {
        miss++;
        missText.textContent = miss;
        playMissSound();

        if (miss >= maxMiss) {
          endGame("패배! 사과를 5개 놓쳤습니다.", "lose");
          return;
        }
      }

      removeItem(i);
    }
  }
}

function movePlayer() {
  if (!gameRunning) return;

  let moved = false;

  if (moveLeft) {
    playerX -= playerSpeed;
    moved = true;
  }

  if (moveRight) {
    playerX += playerSpeed;
    moved = true;
  }

  if (playerX < 0) {
    playerX = 0;
  }

  if (playerX > getGameWidth() - playerWidth) {
    playerX = getGameWidth() - playerWidth;
  }

  if (moved) {
    player.style.left = playerX + "px";

    if (Math.random() < 0.15) {
      playMoveSound();
    }
  }
}

function checkCatch(item) {
  const itemLeft = item.x;
  const itemRight = item.x + itemSize;
  const itemBottom = item.y + itemSize;

  const playerLeft = playerX;
  const playerRight = playerX + playerWidth;
  const playerTop = getGameHeight() - 45;

  const isHit =
    itemBottom >= playerTop &&
    itemRight >= playerLeft &&
    itemLeft <= playerRight;

  if (!isHit) {
    return false;
  }

  if (item.type === "good") {
    score++;
    levelScore++;

    scoreText.textContent = score;
    levelScoreText.textContent = levelScore;

    playCatchSound();

    if (levelScore >= targetScorePerLevel) {
      clearInterval(gameLoop);
      clearInterval(spawnLoop);
      gameRunning = false;

      removeAllItems();

      if (level < 3) {
        showLevelClear();
      } else {
        endGame("최종 승리! 3단계를 모두 클리어했습니다!", "win");
      }
    }
  } else {
    miss++;
    missText.textContent = miss;

    playBadCatchSound();

    if (miss >= maxMiss) {
      endGame("패배! 폭탄을 너무 많이 받았습니다.", "lose");
    }
  }

  return true;
}

function removeItem(index) {
  const item = fallingItems[index];

  if (item && item.element) {
    item.element.remove();
  }

  fallingItems.splice(index, 1);
}

function removeAllItems() {
  fallingItems.forEach((item) => {
    item.element.remove();
  });

  fallingItems = [];
}

function showLevelClear() {
  playLevelUpSound();

  message.innerHTML = `
    <p>${level}단계 클리어!</p>
    <p>다음 단계는 더 많은 낙하물이 더 빠르게 떨어집니다.</p>
    <button id="nextLevelBtn">다음 단계 시작</button>
  `;

  message.style.display = "flex";

  document.getElementById("nextLevelBtn").addEventListener("click", nextLevel);
}

function nextLevel() {
  level++;
  levelScore = 0;

  resetInputState();

  clearInterval(gameLoop);
  clearInterval(spawnLoop);

  removeAllItems();
  applyLevelSettings();

  levelText.textContent = level;
  levelScoreText.textContent = levelScore;

  message.style.display = "none";

  gameRunning = true;

  createStartItems();
  startSpawnLoop();

  gameLoop = setInterval(updateGame, 20);
}

function endGame(text, result) {
  gameRunning = false;

  clearInterval(gameLoop);
  clearInterval(spawnLoop);

  stopBgm();

  resetInputState();

  finalResult = result;

  if (result === "win") {
    playWinSound();
  }

  if (result === "lose") {
    playLoseSound();
  }

  message.innerHTML = `
    <p>${text}</p>
    <p>닉네임을 입력하고 기록을 남겨보세요!</p>
    <input id="nicknameInput" type="text" maxlength="10" placeholder="닉네임 입력" />
    <button id="saveRankBtn">기록 저장</button>
    <button id="restartBtn">다시 시작</button>
  `;

  message.style.display = "flex";

  document.getElementById("saveRankBtn").addEventListener("click", saveRanking);
  document.getElementById("restartBtn").addEventListener("click", startGame);
}

function saveRanking() {
  const nicknameInput = document.getElementById("nicknameInput");
  const nickname = nicknameInput.value.trim();

  if (nickname === "") {
    alert("닉네임을 입력해주세요!");
    return;
  }

  const newRecord = {
    nickname: nickname,
    score: score,
    level: level,
    miss: miss,
    result: finalResult,
    date: new Date().toLocaleString()
  };

  const ranking = JSON.parse(localStorage.getItem("fallingGameRanking")) || [];

  ranking.push(newRecord);

  ranking.sort((a, b) => {
    if (a.result === "win" && b.result !== "win") return -1;
    if (a.result !== "win" && b.result === "win") return 1;
    if (b.level !== a.level) return b.level - a.level;
    if (b.score !== a.score) return b.score - a.score;
    return a.miss - b.miss;
  });

  const top10Ranking = ranking.slice(0, 10);

  localStorage.setItem("fallingGameRanking", JSON.stringify(top10Ranking));

  renderRanking();

  message.innerHTML = `
    <p>기록이 저장되었습니다!</p>
    <button id="restartBtn">다시 시작</button>
  `;

  document.getElementById("restartBtn").addEventListener("click", startGame);
}

function renderRanking() {
  const ranking = JSON.parse(localStorage.getItem("fallingGameRanking")) || [];

  rankingList.innerHTML = "";

  if (ranking.length === 0) {
    rankingList.innerHTML = "<li>아직 기록이 없습니다.</li>";
    return;
  }

  ranking.forEach((record) => {
    const li = document.createElement("li");

    const resultText = record.result === "win" ? "승리" : "패배";
    const resultClass = record.result === "win" ? "win" : "lose";

    li.innerHTML = `
      <strong>${record.nickname}</strong>
      <span class="${resultClass}">[${resultText}]</span>
      ${record.level}단계 / 점수 ${record.score}점 / 놓침 ${record.miss}개
      <br />
      <small>${record.date}</small>
    `;

    rankingList.appendChild(li);
  });
}

renderRanking();
