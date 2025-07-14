import { getSocket } from '../../framework/domber.js'

const gameRoot = document.getElementById('game-root');
const tileLayer = document.getElementById('tile-layer');
const playerLayer = document.getElementById('player-layer');
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
  currentPlayer = playerName

  gameRoot.setAttribute('tabindex', '0');
  gameRoot.focus();

  gameRoot.addEventListener('keydown', handleKeyDown, { passive: false });
  gameRoot.addEventListener('keyup', handleKeyUp);

  drawTiles(gameData)
  drawPlayers(gameData.players)

  // TODO: Implement real game rendering logic here using gameData state
  console.log('[Game] Initialized game container with dimensions:');

  // Start render loop
  animationFrameId = requestAnimationFrame(renderLoop);
}

function drawTiles(gameData) {
  tileLayer.innerHTML = '';
  const gridWidth = gameData.map.w || 15;
  const gridHeight = gameData.map.h || 13;

  for (let y = 0; y < gridHeight; y++) {
    for (let x = 0; x < gridWidth; x++) {
      const tile = document.createElement('div');

      // Get the type from game map
      const tileType = gameData.map.grid[y][x]?.typ || 'empty';

      // Assign tile class (fallback to 'empty')
      tile.className = `tile ${tileType}`;

      tileLayer.appendChild(tile);
    }
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
  drawTiles(gameData)
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

function updatePlayerPosition(players) {
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
    gameData.players[id].keys_pressed = miniPlayer.k;
    gameData.players[id].lives = miniPlayer.l;
    gameData.players[id].state = miniPlayer.s;
  }
  
  for (const bomb of data.b) {
    const x = bomb.x;
    const y = bomb.y;
    gameData.map.grid[y][x].typ = 'bomb';

    if (bomb.e) gameData.map.grid[y][x].typ = 'empty'
  }
}
