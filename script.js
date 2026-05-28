const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

canvas.width = 400;
canvas.height = 600;

// =========================
// 常量
// =========================

const GRAVITY = 0.35;
const JUMP_POWER = -8;
const PIPE_GAP = 280;
const PIPE_INTERVAL = 1800;

let currentPipeSpeed = 1.5;   // 动态初始速度
let currentGroundSpeed = 2;    // 动态地面速度
let pipeSpawnCounter = 0; 
const GROUND_HEIGHT = 80;

// =========================
// 音效资源
// =========================

const flapSound = new Audio("sounds/flap.wav");
const scoreSound = new Audio("sounds/score.wav");
const hitSound = new Audio("sounds/hit.wav");

flapSound.volume = 0.5;

// =========================
// 图片资源
// =========================

const bgImg = new Image();
bgImg.src = "images/bg.png";

const groundImg = new Image();
groundImg.src = "images/ground.png";

const pipeTopImg = new Image();
pipeTopImg.src = "images/pipeTop.png";

const pipeBottomImg = new Image();
pipeBottomImg.src = "images/pipeBottom.png";

const birdFrames = [];
for (let i = 1; i <= 7; i++) {
  const img = new Image();
  img.src = `images/bird${i}.png`;
  birdFrames.push(img);
}

// =========================
// 鸟对象
// =========================

const bird = {
  x: 80,
  y: 250,
  width: 48,
  height: 48,
  velocity: 0
};

// =========================
// 游戏状态
// =========================

let pipes = [];
let score = 0;
let gameStarted = false;
let gameOver = false;

let groundX = 0;
let currentFrame = 0;
let frameTimer = 0;
let leaderboardUpdated = false; 

// =========================
// 街机排行榜
// =========================

function getPlayerName() {
    let name = sessionStorage.getItem("currentPlayer");
    if (!name) {
        name = prompt("请输入你的名字 (中文8个字以内，英文12个字以内):");
        if (!name || name.trim() === "") {
            name = "玩家";
        }
        // 计算字符长度：汉字按2计，英文按1计
        let charCount = 0;
        let result = "";
        for (let char of name) {
            let charLen = /[\u4e00-\u9fff]/.test(char) ? 2 : 1;
            if (charCount + charLen <= 16) {
                result += char;
                charCount += charLen;
            } else {
                break;
            }
        }
        name = result.toUpperCase();
        sessionStorage.setItem("currentPlayer", name);
    }
    return name;
}

function updateLeaderboard(finalScore) {
    const playerName = getPlayerName();
    let leaderboard = JSON.parse(localStorage.getItem("arcade_leaderboard")) || [];
    
    leaderboard.push({ name: playerName, score: finalScore });
    leaderboard.sort((a, b) => b.score - a.score);
    leaderboard = leaderboard.slice(0, 5);
    
    localStorage.setItem("arcade_leaderboard", JSON.stringify(leaderboard));
}

function drawLeaderboard(ctx) {
    let leaderboard = JSON.parse(localStorage.getItem("arcade_leaderboard")) || [];
    
    ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
    ctx.fillRect(60, 350, 280, 180);
    
    ctx.fillStyle = "yellow";
    ctx.font = "12px 'Press Start 2P'";
    ctx.fillText("=== TOP 5 ===", 130, 380);
    
    ctx.fillStyle = "white";
    leaderboard.forEach((entry, index) => {
        let yItem = 410 + index * 24;
        ctx.fillText(`${index + 1}. ${entry.name}`, 90, yItem);
        ctx.fillText(`${entry.score}`, 270, yItem);
    });
}

// =========================
// 生成管道
// =========================

function createPipe() {
  const topHeight = Math.random() * 250 + 50;

  pipes.push({
    x: canvas.width,
    width: 60,
    top: topHeight,
    bottom: topHeight + PIPE_GAP,
    passed: false
  });
}

// =========================
// 控制逻辑
// =========================

function flap() {
  if (!gameStarted) {
    gameStarted = true;
  }

  if (!gameOver) {
    bird.velocity = JUMP_POWER;
    flapSound.currentTime = 0;
    flapSound.play();
  } else {
    location.reload();
  }
}

// =========================
// 事件监听
// =========================

document.addEventListener("keydown", (e) => {
  if (e.code === "Space" || e.key === " ") {
    e.preventDefault();
    flap();
  }
});

canvas.addEventListener("touchstart", (e) => {
  e.preventDefault();
  flap();
}, { passive: false });

canvas.addEventListener("mousedown", () => {
  flap();
});

// =========================
// 更新逻辑
// =========================

function update() {
  if (!gameStarted || gameOver) return;

  currentPipeSpeed = 1.5 + Math.min(score * 0.05, 1.0);
  currentGroundSpeed = currentPipeSpeed * (2 / 1.5);

  pipeSpawnCounter += currentPipeSpeed;
  if (pipeSpawnCounter >= 180) {
    createPipe();
    pipeSpawnCounter = 0;
  }
  
  bird.velocity += GRAVITY;
  bird.y += bird.velocity;

  groundX -= currentGroundSpeed;
  if (groundX <= -400) {
    groundX = 0;
  }

  frameTimer++;
  if (frameTimer > 5) {
    currentFrame = (currentFrame + 1) % birdFrames.length;
    frameTimer = 0;
  }

  if (bird.y < 0 || bird.y + bird.height > canvas.height - GROUND_HEIGHT) {
    if (!gameOver) {
      hitSound.play();
      gameOver = true;
      updateLeaderboard(score);
    }
    return;
  }

  pipes.forEach(p => {
    p.x -= currentPipeSpeed;

    if (!p.passed && p.x + p.width < bird.x) {
      p.passed = true;
      score++;
      scoreSound.currentTime = 0;
      scoreSound.play();
    }

    const margin = 18;
    const hit =
      bird.x + bird.width - margin > p.x &&
      bird.x + margin < p.x + p.width &&
      (bird.y + margin < p.top || bird.y + bird.height - margin > p.bottom);

    if (hit) {
      if (!gameOver) {
        hitSound.play();
        gameOver = true;
        updateLeaderboard(score);
      }
    }
  });

  pipes = pipes.filter(p => p.x + p.width > 0);
}

// =========================
// 绘制函数
// =========================

function drawBackground() {
  if (bgImg.complete) {
    ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);
  } else {
    ctx.fillStyle = "#70c5ce";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
}

function drawGround() {
  if (groundImg.complete) {
    ctx.drawImage(groundImg, groundX, 520, 400, GROUND_HEIGHT);
    ctx.drawImage(groundImg, groundX + 400, 520, 400, GROUND_HEIGHT);
  }
}

function drawBird() {
  const img = birdFrames[currentFrame];

  ctx.save();
  ctx.translate(bird.x + bird.width / 2, bird.y + bird.height / 2);
  ctx.rotate(bird.velocity * 0.05);

  if (img && img.complete) {
    ctx.drawImage(img, -bird.width / 2, -bird.height / 2, bird.width, bird.height);
  } else {
    ctx.fillStyle = "yellow";
    ctx.fillRect(-bird.width / 2, -bird.height / 2, bird.width, bird.height);
  }

  ctx.restore();
}

function drawPipes() {
  pipes.forEach(p => {
    if (pipeTopImg.complete) {
      ctx.drawImage(pipeTopImg, p.x, p.top - pipeTopImg.height, p.width, pipeTopImg.height);
    } else {
      ctx.fillStyle = "green";
      ctx.fillRect(p.x, 0, p.width, p.top);
    }

    if (pipeBottomImg.complete) {
      ctx.drawImage(pipeBottomImg, p.x, p.bottom, p.width, pipeBottomImg.height);
    } else {
      ctx.fillStyle = "green";
      ctx.fillRect(p.x, p.bottom, p.width, canvas.height);
    }
  });
}

function drawText() {
  ctx.fillStyle = "white";
  ctx.strokeStyle = "black";
  ctx.lineWidth = 4;

  const canvasWidth = ctx.canvas.width;

  ctx.font = "16px 'Press Start 2P'";
  const scoreText = `SCORE: ${score}`;
  const scoreWidth = ctx.measureText(scoreText).width;
  const scoreX = (canvasWidth - scoreWidth) / 2;

  ctx.strokeText(scoreText, scoreX, 40);
  ctx.fillText(scoreText, scoreX, 40);

  if (!gameStarted) {
    ctx.font = "14px 'Press Start 2P'";
    const text = "PRESS SPACE";
    const width = ctx.measureText(text).width;

    ctx.strokeText(text, (canvasWidth - width) / 2, 280);
    ctx.fillText(text, (canvasWidth - width) / 2, 280);
  }

  if (gameOver) {
    ctx.font = "14px 'Press Start 2P'";
    const text = "GAME OVER";
    const width = ctx.measureText(text).width;
    ctx.strokeText(text, (canvasWidth - width) / 2, 230);
    ctx.fillText(text, (canvasWidth - width) / 2, 230);

    ctx.font = "10px 'Press Start 2P'";
    const restart = "SPACE TO RESTART";
    const restartWidth = ctx.measureText(restart).width;
    ctx.strokeText(restart, (canvasWidth - restartWidth) / 2, 270);
    ctx.fillText(restart, (canvasWidth - restartWidth) / 2, 270);
    
    drawLeaderboard(ctx);
  }
}

// =========================
// 渲染
// =========================

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  drawBackground();
  drawPipes();
  drawGround();
  drawBird();
  drawText();
}

// =========================
// 游戏循环
// =========================

function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

loop();
