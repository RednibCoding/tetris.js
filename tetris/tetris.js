const canvas = document.createElement("canvas");
canvas.id = "tetris";
canvas.width = 300;
canvas.height = 400;
document.body.appendChild(canvas);
const ctx = canvas.getContext("2d");
ctx.font = "1px consolas"
ctx.scale(20, 20);
const NUM_BLOCKS_X = 10;
const NUM_BLOCKS_Y = 20;

function createKeyboardListener() {
    document.addEventListener("keydown", event => {
        switch(event.key) {
            case "ArrowLeft": case "a":
                playerMove(-1);
                break;
            case "ArrowRight": case "d":
                playerMove(1);
                break;
            case "ArrowDown": case "s":
                playerDrop();
                break;
            case "ArrowUp": case "w":
                playerRotate(1);
                break;
            case "j":
                playerRotate(-1);
                break;
            case "k":
                playerRotate(1);
                break;
        }
    });
}

function removeFullRows() {
    let scoreMultiplier = 1;
    outer: for (let rowNum = board.length - 1; rowNum > 0; --rowNum) {
        for (let i = 0; i < board[rowNum].length; ++i) {
            if (board[rowNum][i] === 0) {
                continue outer;
            }
        }
        
        board.splice(rowNum, 1);
        board.unshift(new Array(NUM_BLOCKS_X).fill(0));
        ++rowNum;

        player.score += scoreMultiplier * 10;
        scoreMultiplier *= 2;
    }

    // Set player.level based on player.score
    player.level = logCeil(player.score, 1.5);
}

function logCeil(val, base) {
    // log(225 / 100.0) / log(1.5)
    let result = Math.log(val/100) / Math.log(base > 1 ? base : 1);
    result = Math.ceil(result);
    return result > 1 ? result : 1;
};

function isColliding(board, player) {
    const [m, o] = [player.currentTetromino, player.currentTetrominoPos];
    for (let y = 0; y < m.length; ++y) {
        for (let x = 0; x < m[y].length; ++x) {
            if (m[y][x] !== 0 && (board[y+o.y] && board[y+o.y][x+o.x]) !== 0) {
                return true;
            }
        }
    }
    return false;
}

function initBoard() {
    w = NUM_BLOCKS_X;
    h = NUM_BLOCKS_Y
    const mat = [];
    while(h--) {
        mat.push(new Array(w).fill(0));
    }
    return mat;
}

function drawMatrix(matrix, offset) {
    matrix.forEach((row, y) => {
        row.forEach((val, x) => {
            if (val !== 0) {
                ctx.fillStyle = colors[val];
                ctx.fillRect(x+offset.x, y+offset.y, 1, 1);
            }
        });
    });
}

function showGameOver() {
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#fff"
    ctx.fillText("GAME OVER", 5, 8);
    ctx.fillText("Score:", 5, 10);
    ctx.fillText(player.score, 5, 11);
}

function draw() {
    if (player.gameover) {
        showGameOver();
        setTimeout(() => {
            player.gameover = false;
            player.score = 0;
            player.level = 1;
            playerReset();
            board.forEach(row => row.fill(0));
        }, 3000);
    } else {
        ctx.fillStyle = "#000";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "#fff";
        ctx.fillRect(10, 0, 0.1, canvas.height);
        ctx.fillText("level:", 11, 3)
        ctx.fillText(player.level, 11, 4)
        ctx.fillText("score:", 11, 6)
        ctx.fillText(player.score, 11, 7)
        ctx.fillText("next:", 11, 10)
        drawMatrix(player.nextTetromino, {x:11, y:11});

        drawMatrix(board, {x:0, y:0});
        drawMatrix(player.currentTetromino, player.currentTetrominoPos);
    }    
}

function createPiece(type) {
    switch(type) {
        case "T":
            return [
                [0, 0, 0],
                [1, 1, 1],
                [0, 1, 0],
            ];
        case "O":
            return [
                [2, 2],
                [2, 2],
            ];
        case "L":
            return [
                [0, 3, 0],
                [0, 3, 0],
                [0, 3, 3],
            ];
        case "J":
            return [
                [0, 4, 0],
                [0, 4, 0],
                [4, 4, 0],
            ];
        case "I":
            return [
                [0, 5, 0, 0],
                [0, 5, 0, 0],
                [0, 5, 0, 0],
                [0, 5, 0, 0],
            ];
        case "S":
            return [
                [0, 6, 6],
                [6, 6, 0],
                [0, 0, 0],
            ];
        case "Z":
            return [
                [7, 7, 0],
                [0, 7, 7],
                [0, 0, 0],
            ];
    }
}

const colors = [
    null,
    '#FF0D72',
    '#0DC2FF',
    '#0DFF72',
    '#F538FF',
    '#FF8E0D',
    '#FFE138',
    '#3877FF',
];

function merge(board, player) {
    player.currentTetromino.forEach((row, y) => {
        row.forEach((val, x) => {
            if (val !== 0) {
                board[y+player.currentTetrominoPos.y][x+player.currentTetrominoPos.x] = val;
            }
        });
    });
}

function playerDrop() {
    player.currentTetrominoPos.y++;
    if (isColliding(board, player)) {
        player.currentTetrominoPos.y--;
        merge(board, player);
        playerReset();
        removeFullRows();
    }
    dropCounter = 0;
}

function playerMove(dir) {
    player.currentTetrominoPos.x += dir;
    if (isColliding(board, player)) {
        player.currentTetrominoPos.x -= dir;
    }
}

function playerRotate(dir) {
    const pos = player.currentTetrominoPos.x;
    let offset = 1;
    rotate(player.currentTetromino, dir);
    while (isColliding(board, player)) {
        player.currentTetrominoPos.x += offset;
        offset = -(offset + (offset > 0 ? 1 : -1));
        if (offset > player.currentTetromino[0].length) {
            rotate(player.currentTetromino, -dir);
            player.currentTetrominoPos.x = pos;
            return;
        }
    }
}

function playerReset() {
    const pieces = "ILJOTSZ";
    player.currentTetromino = player.nextTetromino == null ? createPiece(pieces[pieces.length * Math.random() | 0]) : player.nextTetromino;
    player.nextTetromino = createPiece(pieces[pieces.length * Math.random() | 0]);
    player.currentTetrominoPos.y = 0;
    player.currentTetrominoPos.x = (board[0].length / 2 | 0) - (player.currentTetromino[0].length / 2 | 0);

    // dead (tetromino reached the top)
    if (isColliding(board, player)) {
        player.gameover = true;
    }

}

function rotate(tetromino, dir) {
    for (let y = 0; y < tetromino.length; ++y) {
        for (let x = 0; x < y; ++x) {
            [
                tetromino[x][y],
                tetromino[y][x],
            ] = [
                tetromino[y][x],
                tetromino[x][y],
            ];
        }
    }
    if (dir > 0) {
        tetromino.forEach(row => row.reverse());
    } else {
        tetromino.reverse();
    }
}

let dropCounter = 0;
let dropInterval = 1000;
let lastTime = 0;
function update(time=0) {
    const dt = time - lastTime;
    lastTime = time;
    dropCounter += dt;
    if (dropCounter > (dropInterval / (player.level*0.6))) {
        playerDrop()
        dropCounter = 0;
    }
    draw();
    requestAnimationFrame(update);
}

const board = initBoard();

const player = {
    currentTetrominoPos: {x:0, y:0},
    currentTetromino: null,
    nextTetromino: null,
    score: 0,
    gameover: false,
    level: 1,
}

createKeyboardListener();
playerReset();
update();