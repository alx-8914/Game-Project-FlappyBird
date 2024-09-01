
//board
let board;
let boardWidth = 368;
let boardHeight = 640;
let context;
let gameStarted = false;

// onload game
let onloadImg;

//bird
let birdWidth = 34; // width/height ratio = 408/228 = 17/12
let birdHeight = 24;
let birdX = boardWidth / 8;
let birdY = boardHeight / 2;

let birdUpImg;
let birdDownImg;
let birdMidImg;

let bird = {
    x: birdX,
    y: birdY,
    width: birdWidth,
    height: birdHeight
}

//pipe
let pipeArray = [];
let pipeWidth = 64; //width/height ratio = 384/3072 = 1/8
let pipeHeight = 512;
let pipeX = boardWidth;
let pipeY = 0;

let topPipeImg;
let bottomPipeImg;

//physics
let velocityX = -2;  //pipes moving left speed
let velocityY = 0; //bird jump speed
let gravity = 0.4;

let gameOver = false;
//Score logic
let score = 0;

// game over 
let gameOverImg;

//score logic
let scoreImage = [];
for (let i = 0; i < 10; i++) {
    let img = new Image();
    img.src = `./assets/sprites/${i}.png`;
    scoreImage.push(img);
}

// audio
let hitSound;
let wingSound;
let pointSound;

window.onload = function () {
    board = document.getElementById("gameCanvas");
    board.height = boardHeight;
    board.width = boardWidth;
    context = board.getContext("2d"); //used for drawing on the board

    // load images
    onloadImg = new Image()
    onloadImg.src = "./assets/sprites/message.png"
    onloadImg.onload = function () {
        context.drawImage(
            onloadImg,
            (boardWidth - onloadImg.width) / 2,
            (boardHeight - onloadImg.height) / 2,
            onloadImg.width,
            onloadImg.height
        )
    }
    birdUpImg = new Image();
    birdUpImg.src = "./assets/sprites/redbird-upflap.png"

    birdDownImg = new Image();
    birdDownImg.src = "./assets/sprites/redbird-downflap.png"

    birdMidImg = new Image();
    birdMidImg.src = "./assets/sprites/redbird-midflap.png"
    birdMidImg.onload = function () {
        context.drawImage(birdMidImg, bird.x, bird.y, bird.width, bird.height);
    }

    topPipeImg = new Image();
    topPipeImg.src = "./assets/sprites/toppipe.png";

    bottomPipeImg = new Image();
    bottomPipeImg.src = "./assets/sprites/bottompipe.png";

    gameOverImg = new Image();
    gameOverImg.src = "./assets/sprites/gameover.png";

    // load sounds
    hitSound = new Audio("./assets/audios/hit.wav")
    wingSound = new Audio("./assets/audios/wing.wav")
    pointSound = new Audio("./assets/audios/point.wav")

}

window.addEventListener('keydown', () => {
    if (!gameStarted) {
        gameStarted = true;
        // Inicie o jogo quando uma tecla for pressionada
        startGame()
    }
});

function startGame() {
    requestAnimationFrame(update);
    setInterval(placePipes, 1500);
    window.addEventListener("keydown", moveBird);
}

function update() {
    requestAnimationFrame(update);
    if (gameOver) {
        return;
    }
    context.clearRect(0, 0, board.width, board.height);

    // bird
    velocityY += gravity
    let birdImgTouse;
    if (velocityY < 0) {
        // Se o pássaro estiver subindo
        birdImgTouse = birdUpImg;
    } else if (velocityY > 0) {
        // Se o pássaro estiver descendo 
        birdImgTouse = birdDownImg;
    } else {
        // Se o pássaro estiver parado (não subindo nem descendo)
        birdImgTouse = birdMidImg;
    }

    // bird.y += velocityY;
    bird.y = Math.max(bird.y + velocityY, 0); //apply gravity to current bird.y, limit the bird.y to top of the canvas
    context.drawImage(birdImgTouse, bird.x, bird.y, bird.width, bird.height);

    if (bird.y > board.height) {
        gameOver = true;
    }

    if(gameOver){
        hitSound.play()
        context.drawImage(
            gameOverImg,
            board.width - gameOverImg.width / 2,
            board.height - gameOverImg.height / 2,
        )
    }

    //pipes
    for (let i = 0; i < pipeArray.length; i++) {
        let pipe = pipeArray[i];
        pipe.x += velocityX;
        context.drawImage(
            pipe.img, 
            pipe.x, 
            pipe.y, 
            pipe.width, 
            pipe.height
        );

        if (!pipe.passed && bird.x > pipe.x + pipe.width) {
            score += 0.5; //0.5 because there are 2 pipes! so 0.5*2 = 1, 1 for each set of pipes
            pipe.passed = true;
            pointSound.play();

        }

        if (detectCollision(bird, pipe)) {
            gameOver = true;
        }
    }

    //clear pipes
    while (pipeArray.length > 0 && pipeArray[0].x < -pipeWidth) {
        pipeArray.shift(); //removes first element from the array
    }

    //score
    drawScore(score)

    if (gameOver) {
        hitSound.play();
        context.drawImage(
            gameOverImg,
            (boardWidth - gameOverImg.width) / 2,
            (boardHeight - gameOverImg.height) / 2
        );
        // context.fillText("GAME OVER", 5, 90);
    }
}

function placePipes() {
    if (gameOver) {
        return;
    }

    //(0-1) * pipeHeight/2.
    // 0 -> -128 (pipeHeight/4)
    // 1 -> -128 - 256 (pipeHeight/4 - pipeHeight/2) = -3/4 pipeHeight
    let randomPipeY = pipeY - pipeHeight / 4 - Math.random() * (pipeHeight / 2);
    let openingSpace = board.height / 4;

    let topPipe = {
        img: topPipeImg,
        x: pipeX,
        y: randomPipeY,
        width: pipeWidth,
        height: pipeHeight,
        passed: false
    }
    pipeArray.push(topPipe);

    let bottomPipe = {
        img: bottomPipeImg,
        x: pipeX,
        y: randomPipeY + pipeHeight + openingSpace,
        width: pipeWidth,
        height: pipeHeight,
        passed: false
    }
    pipeArray.push(bottomPipe);
}

function moveBird(e) {
    if (e.code == "Space" || e.code == "ArrowUp" || e.code == "KeyX") {
        //jump
        velocityY = -6;
        wingSound.play();
        //reset game
        if (gameOver) {
            bird.y = birdY;
            pipeArray = [];
            score = 0;
            gameOver = false;
        }
    }
}

function detectCollision(a, b) {
    return a.x < b.x + b.width &&   //a's top left corner doesn't reach b's top right corner
        a.x + a.width > b.x &&   //a's top right corner passes b's top left corner
        a.y < b.y + b.height &&  //a's top left corner doesn't reach b's bottom left corner
        a.y + a.height > b.y;    //a's bottom left corner passes b's top left corner
}

function drawScore(score) {
    let scoreStr = score.toString(); // Converte o score para string
    let digitWidth = scoreImage[0].width; // Largura de cada dígito
    let digitHeight = scoreImage[0].height; // Altura de cada dígito
    let totalWidth = digitWidth * scoreStr.length; // Largura total do score

    // Calcula a posição inicial do primeiro dígito para centralizá-lo
    let startX = (boardWidth - totalWidth) / 2;

    // Desenha cada dígito do score no canvas
    for (let i = 0; i < scoreStr.length; i++) {
        let digit = parseInt(scoreStr[i]); // Converte o dígito de string para número
        let x = startX + i * digitWidth; // Posição horizontal do dígito
        let y = 140; // Posição vertical do dígito
        context.drawImage(scoreImage[digit], x, y, digitWidth, digitHeight);
    }
}