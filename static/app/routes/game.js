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
let flameGrid = null

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
  createPlayers(gameData.players)
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

  flameGrid = Array.from({ length: gridHeight }, () =>
    Array(gridWidth).fill(0)
  );
  
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
        block.id = `block_${x}_${y}`; 
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
  console.warn(powerUps)
  bombLayer.innerHTML = ''; // Clear previous power-ups

  for (const pu of powerUps) {
    const powerUp = document.createElement('div');
    powerUp.className = `tile p`; // e.g., p-bomb, p-flame
    powerUp.style.gridRowStart = pu.y + 1;
    powerUp.style.gridColumnStart = pu.x + 1;
    bombLayer.appendChild(powerUp);
  }
}

function createPlayers(players) {
  playerLayer.innerHTML = '';

  for (const id in players) {
    const player = players[id];
    const el = document.createElement('div');
    el.className = `player ${player.col}`;
    el.id = `player_${id}`;

    el.style.transform = `translate(${player.x}px, ${player.y}px)`;

    playerLayer.appendChild(el);
  }
}

function drawPlayers(players) {
  for (const id in players) {
    const player = players[id];
    const el = document.getElementById(`player_${id}`);

    const newTransform = `translate(${player.x}px, ${player.y}px)`;

    if (el.style.transform !== newTransform) {
      el.style.transform = newTransform;
    }
  }
}

function drawBombs(bombs) {
  const seenIds = new Set();

  for (const bomb of bombs) {
    const id = `bomb_${bomb.x}_${bomb.y}`;
    seenIds.add(id);

    const existing = document.getElementById(id);

    if (existing && bomb.e) {
      existing.remove();
      renderExplosion(bomb);
    } else if (!existing) {
      const bombEl = document.createElement('div');
      bombEl.className = 'tile b';
      bombEl.id = id;
      bombEl.style.gridRowStart = bomb.y + 1;
      bombEl.style.gridColumnStart = bomb.x + 1;
      bombLayer.appendChild(bombEl);
    }
  }

  for (const el of Array.from(bombLayer.children)) {
    if (el.classList.contains('p')) continue;
    if (!seenIds.has(el.id)) {
      el.remove();
      const [_, x, y] = el.id.split('_');
      const bomb = { x: +x, y: +y, r: 1 }; 
      renderExplosion(bomb);
    }
  }
}


export function updateGameState(data) {
  gameData = data;
}

// Rendering function
function renderLoop() {
  drawPlayers(gameData.players);
  drawBombs(gameData.map.bombs);
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

export function stopGameApp(winnerName = "") {
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }

  const winnerOverlay = document.createElement("div");
  winnerOverlay.className = "winner-overlay";
  winnerOverlay.textContent = winnerName
    ? `🏆 Winner: ${winnerName}`
    : `🤝 It's a tie!`;
  gameRoot.appendChild(winnerOverlay);

  setTimeout(() => {
    winnerOverlay.remove();
    tileLayer.innerHTML = "";
    blockLayer.innerHTML = "";
    bombLayer.innerHTML = "";
    exploLayer.innerHTML = "";
    playerLayer.innerHTML = "";
  }, 2000); 
}

export function updateGameMini(data) {
  gameData.ticks = data.t

  for (const [id, miniPlayer] of Object.entries(data.p)) {
    gameData.players[id].x = miniPlayer.x;
    gameData.players[id].y = miniPlayer.y;
    gameData.players[id].dir = miniPlayer.d;
    gameData.players[id].lives = miniPlayer.l;
    gameData.players[id].state = miniPlayer.s;
  }
  
  gameData.map.bombs = data.b;
}

function renderExplosion(bomb) {
  const grid = gameData.map.grid

  const { x, y, r } = bomb;
  const width = grid[0].length;
  const height = grid.length;

  const tiles = [];
  tiles.push({x, y});

  const directions = [
    { dx: 0, dy: -1 }, // up
    { dx: 0, dy: 1 },  // down
    { dx: -1, dy: 0 }, // left
    { dx: 1, dy: 0 }   // right
  ];

  for (const { dx, dy } of directions) {
    for (let i = 1; i <= r; i++) {
      const nx = x + dx * i;
      const ny = y + dy * i;
      const blockId = `block_${nx}_${ny}`;

      if (nx < 0 || ny < 0 || nx >= width || ny >= height) break;
      const tileType = grid[ny][nx].typ;

      if (tileType === TileWall) {
        break;
      } else if (tileType === TileBlock) {
        gameData.map.grid[ny][nx].typ = TileEmpty
        const blockEl = document.getElementById(blockId);
        if (blockEl) blockEl.remove();

        tiles.push({x: nx, y: ny});
        break;
      } else if (tileType === TileEmpty || tileType === TilePowerUp) {
        gameData.map.grid[ny][nx].typ = TileEmpty
        tiles.push({x: nx, y: ny});
      }
    }
  }

  for (const tile of tiles) {
    const { x, y } = tile;
    flameGrid[y][x]++;
    let flame = document.getElementById(`flame_${x}_${y}`);

    if (!flame) {
      flame = document.createElement('div');
      flame.className = 'tile f';
      flame.style.gridRowStart = y + 1;
      flame.style.gridColumnStart = x + 1;
      flame.id = `flame_${x}_${y}`;
      exploLayer.appendChild(flame);
    } else {
      flame.classList.remove('f');
      void flame.offsetWidth;
      flame.classList.add('f');
    }
  }

  setTimeout(() => {
    for (const tile of tiles) {
      const { x, y } = tile;

      flameGrid[y][x]--;
      if (flameGrid[y][x] <= 0) {
        const flame = document.getElementById(`flame_${x}_${y}`);
        if (flame) flame.remove();
        flameGrid[y][x] = 0;
      }
    }
  }, 1000);
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