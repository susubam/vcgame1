const player = document.getElementById("player");
const fallingItem = document.getElementById("fallingItem");
const scoreText = document.getElementById("score");
const missText = document.getElementById("miss");
const message = document.getElementById("message");
const startBtn = document.getElementById("startBtn");
const rankingList = document.getElementById("rankingList");
const resetRankingBtn = document.getElementById("resetRankingBtn");

let playerX = 210;
let itemX = 200;
let itemY = -50;

let score = 0;
let miss = 0;
let finalResult = "";

let gameRunning = false;
let gameLoop;

const playerSpeed = 25;
const itemSpeed = 5;

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
  playSound(220, 0.04, "square", 0.05);
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

document.addEventListener("keydown", (event) => {
  if (!gameRunning) return;

  let moved = false;

  if (event.key === "ArrowLeft") {
    playerX -= playerSpeed;
    moved = true;
  }

  if (event.key === "ArrowRight") {
    playerX += playerSpeed;
    moved = true;
  }

  if (playerX < 0) {
    playerX = 0;
  }

  if (playerX > 420) {
    playerX = 420;
  }

  if (moved) {
    player.style.left = playerX + "px";
    playMoveSound();
  }
});

startBtn.addEventListener("click", startGame);

resetRankingBtn.addEventListener("click", () => {
  localStorage.removeItem("fallingGameRanking");
  renderRanking();
});

function startGame() {
  initAudio();

  score = 0;
  miss = 0;
  playerX = 210;
  finalResult = "";

  scoreText.textContent = score;
  missText.textContent = miss;

  player.style.left = playerX + "px";
  message.style.display = "none";

  resetItem();

  gameRunning = true;

  clearInterval(gameLoop);
  gameLoop = setInterval(updateGame, 20);
}

function updateGame() {
  itemY += itemSpeed;
  fallingItem.style.top = itemY + "px";

  checkCatch();

  if (itemY > 600) {
    miss++;
    missText.textContent = miss;
    resetItem();

    if (miss >= 5) {
      endGame("패배! 사과를 5개 놓쳤습니다.", "lose");
    }
  }
}

function checkCatch() {
  const itemLeft = itemX;
  const itemRight = itemX + 36;
  const itemBottom = itemY + 36;

  const playerLeft = playerX;
  const playerRight = playerX + 80;
  const playerTop = 555;

  if (
    itemBottom >= playerTop &&
    itemRight >= playerLeft &&
    itemLeft <= playerRight
  ) {
    score++;
    scoreText.textContent = score;

    playCatchSound();
    resetItem();

    if (score >= 20) {
      endGame("승리! 사과 20개를 받았습니다!", "win");
    }
  }
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
    miss: miss,
    result: finalResult,
    date: new Date().toLocaleString()
  };

  const ranking = JSON.parse(localStorage.getItem("fallingGameRanking")) || [];

  ranking.push(newRecord);

  ranking.sort((a, b) => {
    if (a.result === "win" && b.result !== "win") return -1;
    if (a.result !== "win" && b.result === "win") return 1;

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
      점수 ${record.score}점 / 놓침 ${record.miss}개
      <br />
      <small>${record.date}</small>
    `;

    rankingList.appendChild(li);
  });
}

renderRanking();