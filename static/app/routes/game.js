import { getSocket } from '../../framework/domber.js'

const gameRoot = document.getElementById('game-root');
const tileLayer = document.getElementById('tile-layer');
const bombLayer = document.getElementById('bomb-layer');
const blockLayer = document.getElementById('block-layer');
const exploLayer = document.getElementById('explosion-layer');
const playerLayer = document.getElementById('player-layer');

const TileEmpty   = "e";
const TileWall    = "w";
const TileBlock   = "bl";
const TileBomb    = "b";
const TileDestroy = "d";
const TilePowerUp = "p";
const TileFlame   = "f";

let socket = null;
let currentPlayer = "";
let gameData = {};
let animationFrameId = null;

export function startGameApp(data, playerName) {
  socket = getSocket('lobby')
  if (!gameRoot || !tileLayer || !playerLayer || !socket) {
    console.error('[Game] Missing elements');
    return;
  }
  if (!data) {
    console.error('[Game] Invalid game data');
    return;
  }
  gameData = data;
  console.warn(gameData)
  currentPlayer = playerName

  gameRoot.setAttribute('tabindex', '0');
  gameRoot.focus();

  gameRoot.addEventListener('keydown', handleKeyDown, { passive: false });
  gameRoot.addEventListener('keyup', handleKeyUp);

  drawTiles(gameData)
  drawPlayers(gameData.players)
  drawPowerUps(gameData.map.p_ups)

  // TODO: Implement real game rendering logic here using gameData state
  console.log('[Game] Initialized game container with dimensions:');

  // Start render loop
  animationFrameId = requestAnimationFrame(renderLoop);
}

function drawTiles(gameData) {
  tileLayer.innerHTML = '';
  blockLayer.innerHTML = '';

  const gridWidth = gameData.map.w || 15;
  const gridHeight = gameData.map.h || 13;

  for (let y = 0; y < gridHeight; y++) {
    for (let x = 0; x < gridWidth; x++) {
      const tile = document.createElement('div');

      // Get the type from game map
      const tileType = gameData.map.grid[y][x].typ === TileWall? TileWall : TileEmpty;

      // Assign tile class (fallback to 'empty')
      tile.className = `tile ${tileType}`;
      if (tileType == TileEmpty){
        const isDark = (x + y) % 2 === 0;
        tile.style.opacity = isDark ? '0.6' : '0.8';
      }

      tileLayer.appendChild(tile);

      if (gameData.map.grid[y][x].typ === TileBlock){
        const block = document.createElement('div');
        block.className = 'tile bl';
        block.style.gridRowStart = y + 1;
        block.style.gridColumnStart = x + 1;
        if ((x + y) % 2 === 0) block.classList.add('bl-alt');

        blockLayer.appendChild(block);
      }

      if (gameData.map.grid[y][x].typ === TileBomb){
        const block = document.createElement('div');
        block.className = 'tile b';
        block.style.gridRowStart = y + 1;
        block.style.gridColumnStart = x + 1;
        blockLayer.appendChild(block);
      }
    }
  }
}

function drawPowerUps(powerUps) {
  bombLayer.innerHTML = ''; // Clear previous power-ups

  for (const pu of powerUps) {
    console.warn("up up and away")
    const powerUp = document.createElement('div');
    powerUp.className = `tile p`; // e.g., p-bomb, p-flame
    powerUp.style.gridRowStart = pu.y + 1;
    powerUp.style.gridColumnStart = pu.x + 1;
    bombLayer.appendChild(powerUp);
  }
}

function drawPlayers(players) {
  playerLayer.innerHTML = '';
  
  const playerIds = Object.keys(players);
  for (const id of playerIds) {
    const player = players[id];
    const el = document.createElement('div');
    el.className = `player ${player.col}`;

    // Pixel-based position
    el.style.transform = `translate(${player.x}px, ${player.y}px)`;

    playerLayer.appendChild(el);
  }
}

export function updateGameState(data) {
  console.log(data)
  gameData = data;
}

// Rendering function
function renderLoop() {
  if (!gameData || !gameRoot) return;

  //updatePlayerPosition(gameData.players);
  //drawTiles(gameData)
  drawPlayers(gameData.players);
  
  // Schedule next frame
  animationFrameId = requestAnimationFrame(renderLoop);
}

const validKeys = [
  'ArrowUp',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
  'w','a', 's', 'd',
  'W', 'A', 'S', 'D',
  ' ', 'Space'
];
const  keysPressed = [];

function handleKeyDown(e) {
  const key = e.key;
  if (!validKeys.includes(key)) {
    return;
  }

  e.preventDefault();
  if (!keysPressed.includes(key)) {
    keysPressed.push(key);
    
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.sendMessage({
        action: 'game',
        player_name: currentPlayer,
        content: JSON.stringify(keysPressed),
      });
    }
  }
}

function handleKeyUp(e) {
  const key = e.key;
  if (!validKeys.includes(key)) return;

  const index = keysPressed.indexOf(key);
  if (index > -1) {
    keysPressed.splice(index, 1);  // Remove the key
    
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.sendMessage({
        action: 'game',
        player_name: currentPlayer,
        content: JSON.stringify(keysPressed),
      });
    }
  }
}

// Stop the render loop if needed (e.g. game ends)
export function stopGameApp() {
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }
}

export function destroyGameApp() {
  if (gameContainer) {
    gameContainer.innerHTML = '';
  }
}

export function updateGameMini(data) {
  gameData.ticks = data.t

  for (const [id, miniPlayer] of Object.entries(data.p)) {
    gameData.players[id].x = miniPlayer.x;
    gameData.players[id].y = miniPlayer.y;
    gameData.players[id].dir = miniPlayer.d;
    //gameData.players[id].keys_pressed = miniPlayer.k;
    gameData.players[id].lives = miniPlayer.l;
    gameData.players[id].state = miniPlayer.s;
  }
  
  for (const bomb of data.b) {
    const x = bomb.x;
    const y = bomb.y;
    gameData.map.grid[y][x].typ = TileBomb;

    //bomb exploded
    if (bomb.e) gameData.map.grid[y][x].typ = TileEmpty
  }
}

/* function updatePlayerPosition(players) {
  for (const id in players) {
    const player = players[id];
    const keys = player.keys_pressed;

    if (!Array.isArray(keys) || keys.length === 0) continue;

    const speed = player.spd || 3;
    const lastKey = keys[keys.length - 1];

    switch (lastKey) {
      case "ArrowUp":
      case "w":
      case "W":
        player.y -= speed;
        player.dir = "up";
        break;
      case "ArrowDown":
      case "s":
      case "S":
        player.y += speed;
        player.dir = "down";
        break;
      case "ArrowLeft":
      case "a":
      case "A":
        player.x -= speed;
        player.dir = "left";
        break;
      case "ArrowRight":
      case "d":
      case "D":
        player.x += speed;
        player.dir = "right";
        break;
    }
  }
  // Optional: clamp position within game bounds
} */