const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

canvas.width = 400;
canvas.height = 600;

// =========================
// 音效资源
// =========================
const flapSound = new Audio("sounds/flap.mp3");
const scoreSound = new Audio("sounds/score.mp3");
const hitSound = new Audio("sounds/hit.mp3");

// 音量调小
flapSound.volume = 0.5;

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
const jumpPower = -8;

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

  const gap = 280;

  const topHeight =
    Math.random() * 250 + 50;

  pipes.push({
    x: canvas.width,
    width: 60,
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
        flapSound.currentTime = 0; // 进度清零，支持连续快速播放
        flapSound.play();
    }
    // 重开
    else {
        location.reload();
    }
}

// ======================
// 键盘
// ======================

document.addEventListener("keydown", (e) => {

  if (
    e.code === "Space" ||
    e.key === " "
  ) {

    e.preventDefault();
    flap();
  }
});

// ======================
// 手机触摸
// ======================

canvas.addEventListener("touchstart", (e) => {

  e.preventDefault();
  flap();

}, {
  passive: false
});

// ======================
// 鼠标
// ======================

canvas.addEventListener("mousedown", () => {

  flap();
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

  if (groundX <= -400) {
    groundX = 0;
  }

  // 动画
  frameTimer++;

  if (frameTimer > 5) {

    currentFrame =
      (currentFrame + 1) %
      birdFrames.length;

    frameTimer = 0;
  }

  // 撞地/天花板
  if (bird.y < 0 || bird.y + bird.height > canvas.height - 80) {
      if (!gameOver) {
          hitSound.play();
      }
      gameOver = true;
  }

  // 管道
  pipes.forEach(p => {

    p.x -= 1.5;

// 得分
if (!p.passed && p.x + p.width < bird.x) {
    p.passed = true;
    score++;
    scoreSound.currentTime = 0;
    scoreSound.play(); // 叮！得分
}

// 碰撞检测（！！！超级宽松版！！！）
const margin = 18;
const hit = bird.x + bird.width - margin > p.x && 
            bird.x + margin < p.x + p.width && 
            (bird.y + margin < p.top || bird.y + bird.height - margin > p.bottom);

if (hit) {
    if (!gameOver) {
        hitSound.play(); // 撞击瞬间放一次音效
    }
    gameOver = true;
}

  // 删除离开屏幕的管道
  pipes = pipes.filter(p => {

    return p.x + p.width > 0;
  });
}

// =========================
// 背景
// =========================

function drawBackground() {

  if (bgImg.complete) {

    ctx.drawImage(
      bgImg,
      0,
      0,
      canvas.width,
      canvas.height
    );

  } else {

    ctx.fillStyle = "#70c5ce";

    ctx.fillRect(
      0,
      0,
      canvas.width,
      canvas.height
    );
  }
}

// =========================
// 地面
// =========================

function drawGround() {

  if (groundImg.complete) {

    ctx.drawImage(
      groundImg,
      groundX,
      520,
      400,
      80
    );

    ctx.drawImage(
      groundImg,
      groundX + 400,
      520,
      400,
      80
    );
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

  ctx.rotate(
    bird.velocity * 0.05
  );

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
// 管道
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

      ctx.fillRect(
        p.x,
        0,
        p.width,
        p.top
      );
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

      ctx.fillRect(
        p.x,
        p.bottom,
        p.width,
        canvas.height
      );
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

  const canvasWidth =
    ctx.canvas.width;

  // 分数
  ctx.font =
    "16px 'Press Start 2P'";

  const scoreText =
    `SCORE: ${score}`;

  const scoreWidth =
    ctx.measureText(scoreText).width;

  const scoreX =
    (canvasWidth - scoreWidth) / 2;

  ctx.strokeText(
    scoreText,
    scoreX,
    40
  );

  ctx.fillText(
    scoreText,
    scoreX,
    40
  );

  // 开始
  if (!gameStarted) {

    ctx.font =
      "14px 'Press Start 2P'";

    const text =
      "PRESS SPACE";

    const width =
      ctx.measureText(text).width;

    ctx.strokeText(
      text,
      (canvasWidth - width) / 2,
      280
    );

    ctx.fillText(
      text,
      (canvasWidth - width) / 2,
      280
    );
  }

  // Game Over
  if (gameOver) {

    ctx.font =
      "14px 'Press Start 2P'";

    const text =
      "GAME OVER";

    const width =
      ctx.measureText(text).width;

    ctx.strokeText(
      text,
      (canvasWidth - width) / 2,
      260
    );

    ctx.fillText(
      text,
      (canvasWidth - width) / 2,
      260
    );

    ctx.font =
      "10px 'Press Start 2P'";

    const restart =
      "SPACE TO RESTART";

    const restartWidth =
      ctx.measureText(restart).width;

    ctx.strokeText(
      restart,
      (canvasWidth - restartWidth) / 2,
      320
    );

    ctx.fillText(
      restart,
      (canvasWidth - restartWidth) / 2,
      320
    );
  }
}

// =========================
// draw
// =========================

function draw() {

  ctx.clearRect(
    0,
    0,
    canvas.width,
    canvas.height
  );

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
