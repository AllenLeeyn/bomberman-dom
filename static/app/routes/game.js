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
  const gridWidth = gameData.g_map.w || 15;
  const gridHeight = gameData.g_map.h || 13;

  for (let y = 0; y < gridHeight; y++) {
    for (let x = 0; x < gridWidth; x++) {
      const tile = document.createElement('div');

      // Get the type from game map
      const tileType = gameData.g_map.grid[y][x]?.typ || 'empty';

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
    el.style.transform = `translate(${player.pos.x}px, ${player.pos.y}px)`;

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

  updateCurrentPlayer(gameData.players, currentPlayer);
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
  'W', 'A', 'S', 'D'
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

function updateCurrentPlayer(players) {
  const player = players[currentPlayer];
  if (!player || keysPressed.length === 0) return;

  const speed = player.movementSpeed || 3;

  const lastKey = keysPressed[keysPressed.length - 1]
  switch (lastKey) {
    case 'ArrowUp':
    case 'w':
    case 'W':
      player.pos.y -= speed;
      break;
    case 'ArrowDown':
    case 's':
    case 'S':
      player.pos.y += speed;
      break;
    case 'ArrowLeft':
    case 'a':
    case 'A':
      player.pos.x -= speed;
      break;
    case 'ArrowRight':
    case 'd':
    case 'D':
      player.pos.x += speed;
      break;
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

