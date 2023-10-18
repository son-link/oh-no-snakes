import * as qx from './qx82/qx.js';
import * as qxa from './qx82/qxa.js';
import * as qut from './qx82/qut.js';

const player = {
  pos: 5,
  y: 18,
};

const cursor = {
  y: 0,
  pos: player.pos
}

const img = await qxa.loadImage('assets/bg.png');
let blocks = []
const OFFSET_X = 24, OFFSET_Y = 24;
let framesCount = 0, speed = 180, score = 0, lives = 3

// 0: Main screen; 1: Playing; 2: Lost live; 3: Game Over
let state = 0
let upSpeedAt = 500; // The speed increase every 1000 points.

/**
 * The main function
 */
async function main() {
  qx.print('Loading...');

  await qxa.key();
  qx.cls()
  qx.frame(doFrame, 30)
}

async function doFrame() {
  qx.cls()
  setCursorPos()
  if (state == 1) {
    framesCount++;
    if (framesCount == speed) {
      framesCount = 0;
      let newLine = [0,0,0,0,0,0,0,0,0,0,0];
    
      for (let i=0; i < Math.floor(Math.random() * (8 - 4)) + 4; i++) {
        newLine[i] = 1;
      }
    
      newLine = qut.shuffleArray(newLine);
      blocks.push(newLine);
    }
  }

  if (state > 0 && state < 3) {
    qx.drawImage(0, 0, img);
    qx.color(7);
    qx.locate(16, 3);
    qx.print((score < 10 ? "0000" : score < 100 ? "000" : score < 1000 ? "00" : score < 10000 ? "0" : "") + score);
    qx.locate(16, 5);
    qx.print(`LIFES: `)
  }

  if (state == 0) {
    qx.locate(4, 6);
    qx.color(14, -1);
    qx.print("\u00d7  Oh!, No, Snakes \u00d8 \u00d9");
    qx.locate(3, 8);
    qx.color(7, -1);
    qx.print("Press Z or 'A' button button\n to start.\n\n");
    qx.print("Controls:\n  Z or 'A' button\n  to shoot.");
    if(qx.keyp('ButtonA') || qx.keyp('z')) state = 1
  } else if (state == 1) {
    drawPlayer()
    drawBlocks()

    // Draw cursor
    qx.color(3);
    qx.spr(0xc2, OFFSET_X + (cursor.pos * 8), OFFSET_Y + cursor.y);

    // Draw live indicators
    let heartX = 23 * 8;
    for (let i = 1; i <= 3; i++) {
      qx.color(10)
      if (i <= lives) qx.spr(0xc4, heartX, 40);
      else qx.spr(0xc3, heartX, 40);
      heartX += 8
    }

    // Check if 
    if (blocks.length == 15) {
      state = 2;
      lives -= 1;

      if (lives == 0) state = 3
    }
  } else if (state == 2) {
    qx.color(10);
    qx.spr(0xc5, OFFSET_X + (player.pos * 8), player.y * 8)
    qx.locate(16, 7);
    qx.print("YOU DIE\nWait");

    // Wait 5 seconds after lose life
    await qxa.wait(5)
    reset()
  } else if (state == 3) {
    qx.cls()
    qx.locate(4, 6);
    qx.color(10, -1);
    qx.print("\u00d7  GAME OVER \u00d8 \u00d9");
    qx.locate(3, 8);
    qx.color(7, -1);
    qx.print("Press Z or 'A' button button\n for back to main screen");
    if(qx.keyp('ButtonA') || qx.keyp('z')) newGame()
  }
}

/**
 * Draw and move the player
 */
function drawPlayer() {
  if (state == 1) {
    const candX =
      player.pos +
      (qx.keyp('ArrowRight') && player.pos < 10 ? 1 : 0) +
      (qx.keyp('ArrowLeft') && player.pos > 0 ? -1 : 0);

    player.pos = candX;
    cursor.pos = candX;
    if(qx.keyp('ButtonA') || qx.keyp('z')) shot()
  }

  qx.color(12);
  qx.spr(0xc0, OFFSET_X + (player.pos * 8), player.y * 8);
}

/**
 * Draw the snakes
 */
function drawBlocks() {
  let y = OFFSET_Y + ((blocks.length - 1) * 8)

  blocks.forEach( line => {
    for (let x = 0; x < 11; x++) {
      if (line[x] == 1) {
        qx.color(10);
        qx.spr(0xc1, OFFSET_X + (x * 8) , y);
      }
    }
    y -= 8
  })
}

/**
 * This function checks and returns the row to which the cursor or a new snake can be moved.
 * @returns {*} False if there are no rows or row number
 */
function checkPosition() {
  let v = 0;
  
  if (blocks.length == 0) return false;

  for (let i = 0; i < blocks.length; i++) {
    let line = blocks[i];

    if (typeof blocks[i+1] === 'undefined' && line[player.pos] == 0) {
      v = i;
      break;
    } else if (line[player.pos] == 0 && blocks[i+1][player.pos] == 1) {
      v = i;
      break;
    } else if (i == 0 && line[player.pos] == 1) {
      v = false;
      break;
    }
  }
  return v;
}

/**
 * Change the cursor position
 */
function setCursorPos() {
  let cp = checkPosition();
  if (typeof cp === 'number') {
    if (cp == blocks.length - 1) cursor.y = 0;
    else cursor.y = ((blocks.length - cp - 1) * 8)
  } else cursor.y = (blocks.length) * 8
}

/**
 * This function goes through the lines to check if a line is complete and then delete it.
 */
function checkLines () {
  for (let i = 0; i < blocks.length; i++) {
    let cont = 0;
    let line = blocks[i];
    
    line.forEach( (v, i) => {
      if (v == 1) cont++;
    });

    if (cont == 11) blocks.splice(i,1);
  }
}

/**
 * This function is called each time the player fires and will add a new block.
 */
function shot () {
  if (blocks.length > 0) {
    let cp = checkPosition();
    if (typeof cp === 'number') {
      blocks[cp][cursor.pos] = 1;
    } else {
      let tempLine = [];
      let tempTable = [];
      
      for (let i = 0; i < 11; i++) {
        if (i == cursor.pos) tempLine[i] = 1;
        else tempLine[i] = 0;
      }

      tempTable[0] = tempLine;

      for(let i = 0; i < blocks.length; i++) {
        tempTable[i+1] = blocks[i];
      }

      blocks = tempTable;
    }
  } else {
    let tempLine = [];

    for (let i = 0; i < 10; i++) {
      if (i == cursor.pos) tempLine[i] = 1;
      else tempLine[i] = 0;
    }

    blocks.unshift(tempLine);
  }

  score += 10;

  if (score % upSpeedAt == 0) {
    speed -= 20;
    framesCount = 0;
  }

  checkLines();
  setCursorPos();
}

function reset() {
  blocks = []
  framesCount = 0
  player.pos = 5
  cursor.pos = 5
  cursor.y = OFFSET_Y
  state = 1
}

function newGame() {
  reset()
  state = 0
  score = 0
  speed = 180
  lives = 3
}

// Start main process on load all content
window.addEventListener('load', () => qx.init(main));
