const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

canvas.width = 400;
canvas.height = 600;

// =========================
// 图片资源
// =========================

// 背景
const bgImg = new Image();
bgImg.src = "images/bg.png";

// 地面
const groundImg = new Image();
groundImg.src = "images/ground.png";

// 管道
const pipeTopImg = new Image();
pipeTopImg.src = "images/pipeTop.png";

const pipeBottomImg = new Image();
pipeBottomImg.src = "images/pipeBottom.png";

// 鸟动画
const birdFrames = [];

for (let i = 1; i <= 7; i++) {
  const img = new Image();
  img.src = `images/bird${i}.png`;
  birdFrames.push(img);
}

// =========================
// 鸟
// =========================

const bird = {
  x: 80,
  y: 250,
  width: 48,
  height: 48,
  velocity: 0
};

const gravity = 0.35;
const jumpPower = -9;

// =========================
// 游戏状态
// =========================

let pipes = [];
let score = 0;

let gameStarted = false;
let gameOver = false;

let groundX = 0;

// 动画
let currentFrame = 0;
let frameTimer = 0;

// =========================
// 生成管道
// =========================

function createPipe() {
  const gap = 280;  //管道间隔
  const topHeight = Math.random() * 250 + 50;

  pipes.push({
    x: canvas.width,
    width: 70,
    top: topHeight,
    bottom: topHeight + gap,
    passed: false
  });
}

// =========================
// 管道生成器
// =========================

setInterval(() => {
  if (gameStarted && !gameOver) {
    createPipe();
  }
}, 1800);

// =========================
// 控制
// =========================

function flap() {

  // 开始
  if (!gameStarted) {
    gameStarted = true;
  }

  // 跳跃
  if (!gameOver) {
    bird.velocity = jumpPower;
  }

  // 重开
  else {
    location.reload();
  }
}

// 键盘
document.addEventListener("keydown", (e) => {

  if (e.code === "Space") {

    flap();
  }
});

// 手机
canvas.addEventListener("touchstart", (e) => {

  e.preventDefault();

  flap();

}, { passive: false });

// 鼠标点击
canvas.addEventListener("mousedown", () => {

  flap();
});
    if (!gameStarted) gameStarted = true;

    if (!gameOver) {
      bird.velocity = jumpPower;
    } else {
      location.reload();
    }
  }
});

// =========================
// 更新逻辑
// =========================

function update() {
  if (!gameStarted || gameOver) return;

  // 重力
  bird.velocity += gravity;
  bird.y += bird.velocity;

  // 地面滚动
  groundX -= 2;
  if (groundX <= -400) groundX = 0;

  // 动画帧
  frameTimer++;
  if (frameTimer > 5) {
    currentFrame = (currentFrame + 1) % birdFrames.length;
    frameTimer = 0;
  }

  // 撞地/天花板
  if (bird.y < 0 || bird.y + bird.height > canvas.height - 80) {
    gameOver = true;
  }

  // 管道
  pipes.forEach(p => {
    p.x -= 1.5;

    // 得分
    if (!p.passed && p.x + p.width < bird.x) {
      p.passed = true;
      score++;
    }

    // 碰撞
    const hit =
      bird.x + bird.width > p.x &&
      bird.x < p.x + p.width &&
      (bird.y < p.top || bird.y + bird.height > p.bottom);

    if (hit) gameOver = true;
  });

  pipes = pipes.filter(p => p.x + p.width > 0);
}

// =========================
// 背景
// =========================

function drawBackground() {
  if (bgImg.complete) {
    ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);
  } else {
    ctx.fillStyle = "#70c5ce";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
}

// =========================
// 地面
// =========================

function drawGround() {
  if (groundImg.complete) {
    ctx.drawImage(groundImg, groundX, 520, 400, 80);
    ctx.drawImage(groundImg, groundX + 400, 520, 400, 80);
  }
}

// =========================
// 鸟
// =========================

function drawBird() {
  const img = birdFrames[currentFrame];

  ctx.save();
  ctx.translate(
    bird.x + bird.width / 2,
    bird.y + bird.height / 2
  );

  ctx.rotate(bird.velocity * 0.05);

  if (img && img.complete) {
    ctx.drawImage(
      img,
      -bird.width / 2,
      -bird.height / 2,
      bird.width,
      bird.height
    );
  } else {
    ctx.fillStyle = "yellow";
    ctx.fillRect(
      -bird.width / 2,
      -bird.height / 2,
      bird.width,
      bird.height
    );
  }

  ctx.restore();
}

// =========================
// 管道（上下分离版）
// =========================

function drawPipes() {
  pipes.forEach(p => {

    // 上管道
    if (pipeTopImg.complete) {
      ctx.drawImage(
        pipeTopImg,
        p.x,
        p.top - pipeTopImg.height,
        p.width,
        pipeTopImg.height
      );
    } else {
      ctx.fillStyle = "green";
      ctx.fillRect(p.x, 0, p.width, p.top);
    }

    // 下管道
    if (pipeBottomImg.complete) {
      ctx.drawImage(
        pipeBottomImg,
        p.x,
        p.bottom,
        p.width,
        pipeBottomImg.height
      );
    } else {
      ctx.fillStyle = "green";
      ctx.fillRect(p.x, p.bottom, p.width, canvas.height);
    }
  });
}

// =========================
// UI
// =========================

function drawText() {
  ctx.fillStyle = "white";
  ctx.strokeStyle = "black";
  ctx.lineWidth = 4;

  // 获取画布宽度用于居中计算
  const canvasWidth = ctx.canvas.width;

  // 分数显示
  ctx.font = "16px 'Press Start 2P'";
  const scoreText = `SCORE: ${score}`;
  const scoreTextWidth = ctx.measureText(scoreText).width;
  const scoreX = (canvasWidth - scoreTextWidth) / 2;
  ctx.strokeText(scoreText, scoreX, 40);
  ctx.fillText(scoreText, scoreX, 40);

  if (!gameStarted) {
    ctx.font = "14px 'Press Start 2P'";
    const startText = "PRESS SPACE";
    const startTextWidth = ctx.measureText(startText).width;
    const startX = (canvasWidth - startTextWidth) / 2;
    ctx.strokeText(startText, startX, 280);
    ctx.fillText(startText, startX, 280);
  }

  if (gameOver) {
    ctx.font = "14px 'Press Start 2P'";
    const gameOverText = "GAME OVER";
    const gameOverTextWidth = ctx.measureText(gameOverText).width;
    const gameOverX = (canvasWidth - gameOverTextWidth) / 2;
    ctx.strokeText(gameOverText, gameOverX, 260);
    ctx.fillText(gameOverText, gameOverX, 260);

    ctx.font = "10px 'Press Start 2P'";
    const restartText = "SPACE TO RESTART";
    const restartTextWidth = ctx.measureText(restartText).width;
    const restartX = (canvasWidth - restartTextWidth) / 2;
    ctx.strokeText(restartText, restartX, 320);
    ctx.fillText(restartText, restartX, 320);
  }
}


// =========================
// draw
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
// loop
// =========================

function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

loop();
