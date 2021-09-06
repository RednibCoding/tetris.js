const canvas = document.createElement("canvas");
canvas.id = "tetris";
canvas.width = 300;
canvas.height = 400;
document.body.appendChild(canvas);
const ctx = canvas.getContext("2d");
ctx.font = "1px consolas"
ctx.scale(20, 20);

function createKeyboard() {
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
            case "j":
                playerRotate(-1);
                break;
            case "k":
                playerRotate(1);
                break;
        }
    });
}

function arenaSweep() {
    let rowCount = 1;
    outer: for (let y = arena.length - 1; y > 0; --y) {
        for (let x = 0; x < arena[y].length; ++x) {
            if (arena[y][x] === 0) {
                continue outer;
            }
        }
        const row = arena.splice(y, 1)[0].fill(0);
        arena.unshift(row);
        ++y;

        player.score += rowCount * 10;
        rowCount *= 2;
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

function collide(arena, player) {
    const [m, o] = [player.matrix, player.pos];
    for (let y = 0; y < m.length; ++y) {
        for (let x = 0; x < m[y].length; ++x) {
            if (m[y][x] !== 0 &&
                 (arena[y+o.y] && arena[y+o.y][x+o.x]) !== 0) {
                return true;
            }
        }
    }
    return false;
}

function createMatrix(w, h) {
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
            arena.forEach(row => row.fill(0));
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
        drawMatrix(player.next, {x:11, y:11});

        drawMatrix(arena, {x:0, y:0});
        drawMatrix(player.matrix, player.pos);
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

function merge(arena, player) {
    player.matrix.forEach((row, y) => {
        row.forEach((val, x) => {
            if (val !== 0) {
                arena[y+player.pos.y][x+player.pos.x] = val;
            }
        });
    });
}

function playerDrop() {
    player.pos.y++;
    if (collide(arena, player)) {
        player.pos.y--;
        merge(arena, player);
        playerReset();
        arenaSweep();
    }
    dropCounter = 0;
}

function playerMove(dir) {
    player.pos.x += dir;
    if (collide(arena, player)) {
        player.pos.x -= dir;
    }
}

function playerRotate(dir) {
    const pos = player.pos.x;
    let offset = 1;
    rotate(player.matrix, dir);
    while (collide(arena, player)) {
        player.pos.x += offset;
        offset = -(offset + (offset > 0 ? 1 : -1));
        if (offset > player.matrix[0].length) {
            rotate(player.matrix, -dir);
            player.pos.x = pos;
            return;
        }
    }
}

function playerReset() {
    const pieces = "ILJOTSZ";
    player.matrix = player.next == null ? createPiece(pieces[pieces.length * Math.random() | 0]) : player.next;
    player.next = createPiece(pieces[pieces.length * Math.random() | 0]);
    player.pos.y = 0;
    player.pos.x = (arena[0].length / 2 | 0) - (player.matrix[0].length / 2 | 0);

    // dead (tetromino reached the top)
    if (collide(arena, player)) {
        player.gameover = true;
    }

}

function rotate(matrix, dir) {
    for (let y = 0; y < matrix.length; ++y) {
        for (let x = 0; x < y; ++x) {
            [
                matrix[x][y],
                matrix[y][x],
            ] = [
                matrix[y][x],
                matrix[x][y],
            ];
        }
    }
    if (dir > 0) {
        matrix.forEach(row => row.reverse());
    } else {
        matrix.reverse();
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

const arena = createMatrix(10, 20);

const player = {
    pos: {x:0, y:0},
    matrix: null,
    next: null,
    score: 0,
    gameover: false,
    level: 1,
}

createKeyboard();
playerReset();
update();