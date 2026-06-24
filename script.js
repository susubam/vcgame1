const gameArea = document.getElementById("gameArea");
const player = document.getElementById("player");
const fallingItem = document.getElementById("fallingItem");
const scoreText = document.getElementById("score");
const missText = document.getElementById("miss");
const message = document.getElementById("message");
const startBtn = document.getElementById("startBtn");

let playerX = 210;
let itemX = 200;
let itemY = -50;

let score = 0;
let miss = 0;

let gameRunning = false;
let gameLoop;

const playerSpeed = 25;
const itemSpeed = 5;

document.addEventListener("keydown", (event) => {
  if (!gameRunning) return;

  if (event.key === "ArrowLeft") {
    playerX -= playerSpeed;
  }

  if (event.key === "ArrowRight") {
    playerX += playerSpeed;
  }

  if (playerX < 0) {
    playerX = 0;
  }

  if (playerX > 420) {
    playerX = 420;
  }

  player.style.left = playerX + "px";
});

startBtn.addEventListener("click", startGame);

function startGame() {
  score = 0;
  miss = 0;
  playerX = 210;

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
      endGame("패배! 사과를 5개 놓쳤습니다.");
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
    resetItem();

    if (score >= 20) {
      endGame("승리! 사과 20개를 받았습니다!");
    }
  }
}

function resetItem() {
  itemY = -50;
  itemX = Math.floor(Math.random() * 460);
  fallingItem.style.left = itemX + "px";
  fallingItem.style.top = itemY + "px";
}

function endGame(text) {
  gameRunning = false;
  clearInterval(gameLoop);

  message.innerHTML = `
    <p>${text}</p>
    <button id="restartBtn">다시 시작</button>
  `;

  message.style.display = "flex";

  document.getElementById("restartBtn").addEventListener("click", startGame);
}