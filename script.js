const player = document.getElementById("player");
const fallingItem = document.getElementById("fallingItem");
const levelText = document.getElementById("level");
const scoreText = document.getElementById("score");
const levelScoreText = document.getElementById("levelScore");
const missText = document.getElementById("miss");
const message = document.getElementById("message");
const startBtn = document.getElementById("startBtn");
const rankingList = document.getElementById("rankingList");
const resetRankingBtn = document.getElementById("resetRankingBtn");

let playerX = 200;
let playerWidth = 100;

let itemX = 200;
let itemY = -50;

let level = 1;
let score = 0;
let levelScore = 0;
let miss = 0;
let finalResult = "";

let gameRunning = false;
let gameLoop;

let moveLeft = false;
let moveRight = false;

const playerSpeed = 9;
const targetScorePerLevel = 20;
const maxMiss = 5;

const levelSettings = {
  1: {
    itemSpeed: 5,
    playerWidth: 100
  },
  2: {
    itemSpeed: 7,
    playerWidth: 80
  },
  3: {
    itemSpeed: 9,
    playerWidth: 60
  }
};

let audioContext;

function initAudio() {
  if (!audioContext) {
    audioContext = new AudioContext();
  }
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
    moveLeft = true;
  }

  if (event.key === "ArrowRight") {
    moveRight = true;
  }
});

document.addEventListener("keyup", (event) => {
  if (event.key === "ArrowLeft") {
    moveLeft = false;
  }

  if (event.key === "ArrowRight") {
    moveRight = false;
  }
});

startBtn.addEventListener("click", startGame);

resetRankingBtn.addEventListener("click", () => {
  localStorage.removeItem("fallingGameRanking");
  renderRanking();
});

function startGame() {
  initAudio();

  level = 1;
  score = 0;
  levelScore = 0;
  miss = 0;
  finalResult = "";

  moveLeft = false;
  moveRight = false;

  applyLevelSettings();

  scoreText.textContent = score;
  levelScoreText.textContent = levelScore;
  missText.textContent = miss;
  levelText.textContent = level;

  message.style.display = "none";

  resetItem();

  gameRunning = true;

  clearInterval(gameLoop);
  gameLoop = setInterval(updateGame, 20);
}

function applyLevelSettings() {
  playerWidth = levelSettings[level].playerWidth;
  playerX = (500 - playerWidth) / 2;

  player.style.width = playerWidth + "px";
  player.style.left = playerX + "px";
}

function updateGame() {
  movePlayer();

  itemY += levelSettings[level].itemSpeed;
  fallingItem.style.top = itemY + "px";

  checkCatch();

  if (itemY > 600) {
    miss++;
    missText.textContent = miss;
    resetItem();

    if (miss >= maxMiss) {
      endGame("패배! 사과를 5개 놓쳤습니다.", "lose");
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

  if (playerX > 500 - playerWidth) {
    playerX = 500 - playerWidth;
  }

  if (moved) {
    player.style.left = playerX + "px";

    if (Math.random() < 0.15) {
      playMoveSound();
    }
  }
}

function checkCatch() {
  const itemLeft = itemX;
  const itemRight = itemX + 36;
  const itemBottom = itemY + 36;

  const playerLeft = playerX;
  const playerRight = playerX + playerWidth;
  const playerTop = 555;

  if (
    itemBottom >= playerTop &&
    itemRight >= playerLeft &&
    itemLeft <= playerRight
  ) {
    score++;
    levelScore++;

    scoreText.textContent = score;
    levelScoreText.textContent = levelScore;

    playCatchSound();
    resetItem();

    if (levelScore >= targetScorePerLevel) {
      clearInterval(gameLoop);
      gameRunning = false;

      if (level < 3) {
        showLevelClear();
      } else {
        endGame("최종 승리! 3단계를 모두 클리어했습니다!", "win");
      }
    }
  }
}

function showLevelClear() {
  playLevelUpSound();

  message.innerHTML = `
    <p>${level}단계 클리어!</p>
    <p>다음 단계는 더 빨라지고 막대가 작아집니다.</p>
    <button id="nextLevelBtn">다음 단계 시작</button>
  `;

  message.style.display = "flex";

  document.getElementById("nextLevelBtn").addEventListener("click", nextLevel);
}

function nextLevel() {
  level++;
  levelScore = 0;

  moveLeft = false;
  moveRight = false;

  levelText.textContent = level;
  levelScoreText.textContent = levelScore;

  applyLevelSettings();
  resetItem();

  message.style.display = "none";

  gameRunning = true;

  clearInterval(gameLoop);
  gameLoop = setInterval(updateGame, 20);
}

function resetItem() {
  itemY = -50;
  itemX = Math.floor(Math.random() * 460);

  fallingItem.style.left = itemX + "px";
  fallingItem.style.top = itemY + "px";
}

function endGame(text, result) {
  gameRunning = false;
  clearInterval(gameLoop);

  moveLeft = false;
  moveRight = false;

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