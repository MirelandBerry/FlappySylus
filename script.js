// =========================
// 初始化 Canvas
// =========================

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
const PIPE_SPEED = 1.5;
const GROUND_SPEED = 2;
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
// 管道自动生成
// =========================

setInterval(() => {
  if (gameStarted && !gameOver) {
    createPipe();
  }
}, PIPE_INTERVAL);

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

// 键盘
document.addEventListener("keydown", (e) => {
  if (e.code === "Space" || e.key === " ") {
    e.preventDefault();
    flap();
  }
});

// 触摸
canvas.addEventListener("touchstart", (e) => {
  e.preventDefault();
  flap();
}, { passive: false });

// 鼠标
canvas.addEventListener("mousedown", () => {
  flap();
});

// =========================
// 更新逻辑
// =========================

function update() {
  if (!gameStarted || gameOver) return;

  // 重力和位置更新
  bird.velocity += GRAVITY;
  bird.y += bird.velocity;

  // 地面滚动
  groundX -= GROUND_SPEED;
  if (groundX <= -400) {
    groundX = 0;
  }

  // 鸟动画更新
  frameTimer++;
  if (frameTimer > 5) {
    currentFrame = (currentFrame + 1) % birdFrames.length;
    frameTimer = 0;
  }

  // 碰撞检测：地面和天花板
  if (bird.y < 0 || bird.y + bird.height > canvas.height - GROUND_HEIGHT) {
    if (!gameOver) {
      hitSound.play();
    }
    gameOver = true;
    return;
  }

  // 管道更新和碰撞检测
  pipes.forEach(p => {
    p.x -= PIPE_SPEED;

    // 得分判定
    if (!p.passed && p.x + p.width < bird.x) {
      p.passed = true;
      score++;
      scoreSound.currentTime = 0;
      scoreSound.play();
    }

    // 碰撞检测
    const margin = 18;
    const hit =
      bird.x + bird.width - margin > p.x &&
      bird.x + margin < p.x + p.width &&
      (bird.y + margin < p.top || bird.y + bird.height - margin > p.bottom);

    if (hit) {
      if (!gameOver) {
        hitSound.play();
      }
      gameOver = true;
    }
  });

  // 清理离开屏幕的管道
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
    // 上管道
    if (pipeTopImg.complete) {
      ctx.drawImage(pipeTopImg, p.x, p.top - pipeTopImg.height, p.width, pipeTopImg.height);
    } else {
      ctx.fillStyle = "green";
      ctx.fillRect(p.x, 0, p.width, p.top);
    }

    // 下管道
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

  // 分数
  ctx.font = "16px 'Press Start 2P'";
  const scoreText = `SCORE: ${score}`;
  const scoreWidth = ctx.measureText(scoreText).width;
  const scoreX = (canvasWidth - scoreWidth) / 2;

  ctx.strokeText(scoreText, scoreX, 40);
  ctx.fillText(scoreText, scoreX, 40);

  // 开始提示
  if (!gameStarted) {
    ctx.font = "14px 'Press Start 2P'";
    const text = "PRESS SPACE";
    const width = ctx.measureText(text).width;

    ctx.strokeText(text, (canvasWidth - width) / 2, 280);
    ctx.fillText(text, (canvasWidth - width) / 2, 280);
  }

  // Game Over
  if (gameOver) {
    ctx.font = "14px 'Press Start 2P'";
    const text = "GAME OVER";
    const width = ctx.measureText(text).width;

    ctx.strokeText(text, (canvasWidth - width) / 2, 260);
    ctx.fillText(text, (canvasWidth - width) / 2, 260);

    ctx.font = "10px 'Press Start 2P'";
    const restart = "SPACE TO RESTART";
    const restartWidth = ctx.measureText(restart).width;

    ctx.strokeText(restart, (canvasWidth - restartWidth) / 2, 320);
    ctx.fillText(restart, (canvasWidth - restartWidth) / 2, 320);
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
