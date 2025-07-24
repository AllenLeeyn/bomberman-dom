import { getSocket } from '../../framework/domber.js'
import { 
  playBombPlace, 
  playExplosion, 
  playPowerup, 
  playDeath,
  startBackgroundMusic,
  stopBackgroundMusic,
  playVictory,
  playDefeat, 
} from '../sound.js'

const gameRoot = document.getElementById('game-root');
const tileLayer = document.getElementById('tile-layer');
const bombLayer = document.getElementById('bomb-layer');
const blockLayer = document.getElementById('block-layer');
const exploLayer = document.getElementById('explosion-layer');
const playerLayer = document.getElementById('player-layer');

const TileSize = 48;
const PlayerSize = 36;

const TileEmpty = "e";
const TileWall = "w";
const TileBlock = "bl";
const TileBomb = "b";
const TileDestroy = "d";
const TilePowerUp = "p";
const TileFlame = "f";

const powerUpMessages = {
  bombUp: "+1 Bomb",
  flameUp: "+1 Range",
  speedUp: "+1 Speed",
  bombPass: "Bomb Pass",
  blockPass: "Block Pass",
  liveUp: "+1 Life",
};

let socket = null;
let currentPlayer = "";
let gameData = {};
let animationFrameId = null;
let flameGrid = null;

// Track previous lives to detect changes
let previousLives = {};

// Generate hearts based on lives count
function generateHearts(lives) {
  return lives > 0 ? '❤️'.repeat(lives) : '💀';
}

export function startGameApp(data, playerName) {

  socket = getSocket("lobby");
  if (!gameRoot || !tileLayer || !playerLayer || !socket) {
    console.error("[Game] Missing elements");
    return;
  }
  if (!data) {
    console.error("[Game] Invalid game data");
    return;
  }
  gameData = data;
  currentPlayer = playerName;

  gameRoot.setAttribute("tabindex", "0");
  gameRoot.focus();

  gameRoot.addEventListener("keydown", handleKeyDown, { passive: false });
  gameRoot.addEventListener("keyup", handleKeyUp);

  drawTiles(gameData);
  createPlayers(gameData.players);
  createPlayerHUD(gameData.players);
  startBackgroundMusic();

  console.log('[Game] Initialized game container with dimensions:');

  // Start render loop
  animationFrameId = requestAnimationFrame(renderLoop);
}

function drawTiles(gameData) {
  tileLayer.innerHTML = "";
  blockLayer.innerHTML = "";
  bombLayer.innerHTML = "";

  const gridWidth = gameData.map.w || 15;
  const gridHeight = gameData.map.h || 13;

  flameGrid = Array.from({ length: gridHeight }, () =>
    Array(gridWidth).fill(0)
  );

  for (let y = 0; y < gridHeight; y++) {
    for (let x = 0; x < gridWidth; x++) {
      const tile = document.createElement("div");

      if (gameData.map.grid[y][x].typ === TileBlock) {
        const block = document.createElement("div");
        block.id = `block_${x}_${y}`;
        block.className = "tile bl";
        block.style.gridRowStart = y + 1;
        block.style.gridColumnStart = x + 1;
        blockLayer.appendChild(block);
      }

      if (gameData.map.grid[y][x].p_ups !== "") {
        const powerUp = document.createElement("div");
        const type = gameData.map.grid[y][x].p_ups;

        powerUp.id = `powup_${x}_${y}`;
        powerUp.className = `tile p p-${type}`;
        powerUp.style.gridRowStart = y + 1;
        powerUp.style.gridColumnStart = x + 1;

        bombLayer.appendChild(powerUp);
      }
    }
  }
}

function createPlayers(players) {
  playerLayer.innerHTML = "";

  for (const id in players) {
    const player = players[id];
    const el = document.createElement("div");
    el.className = `player`;
    el.id = `player_${id}`;

    el.style.transform = `translate(${player.x}px, ${player.y}px)`;

    // Validate color or fallback to 'blue'
    const allowedColors = ["red", "blue", "green", "yellow"];
    const color = allowedColors.includes(player.col) ? player.col : "blue";

    // Create images for each direction
    const directions = ["front", "back", "left", "right", "dead"];
    directions.forEach((dir) => {
      const img = document.createElement("img");
      img.src = `./static/app/bot_${color}_${dir}.png`;
      img.className = `player-img dir-${dir}`;
      img.style.display = dir === "front" ? "" : "none";
      el.appendChild(img);
    });

    playerLayer.appendChild(el);
  }
}

function drawPlayers(players) {
  const grid = gameData.map.grid;

  for (const id in players) {
    const dirMap = {
      u: "back",
      d: "front",
      l: "left",
      r: "right",
    };
    const player = players[id];
    const el = document.getElementById(`player_${id}`);
    const imgs = el.querySelectorAll(".player-img");
    let activeDir = dirMap[player.dir];

    const playerTileTop = Math.floor(player.y / TileSize);
    const playerTileBottom = Math.floor((player.y + PlayerSize - 1) / TileSize);
    const playerTileLeft = Math.floor(player.x / TileSize);
    const playerTileRight = Math.floor((player.x + PlayerSize - 1) / TileSize);

    const newTransform = `translate(${player.x}px, ${player.y}px)`;

    if (el.style.transform !== newTransform) {
      el.style.transform = newTransform;
    }

    
    if (player.state === 'dd') {
      imgs.forEach(img => {
        if (img.classList.contains('dir-dead')) {
          // playDeath();
          img.style.display = 'block';
          img.classList.add('elongate-death');
        } else {
          img.style.display = "none";
        }
      });

      setTimeout(() => {
        el.style.display = "none";
      }, 1000);
      continue;
    }

    if (player.state === "rs") {
      el.classList.add("flicker");
    } else {
      el.classList.remove("flicker");
    }

    imgs.forEach((img) => {
      if (img.classList.contains(`dir-${activeDir}`)) {
        img.style.display = "";
      } else {
        img.style.display = "none";
      }
    });

    let y = playerTileBottom;
    let x = playerTileLeft;

    if (player.dir == "u") {
      y = playerTileTop;
      x = playerTileLeft;
    } else if (player.dir == "r") {
      y = playerTileTop;
      x = playerTileRight;
    }

    if (grid[y][x].p_ups !== "" && grid[y][x].typ === TileEmpty ) {
      const powUpEl = document.getElementById(`powup_${x}_${y}`);
      if (powUpEl) {
          playPowerup();
          powUpEl.remove();
      }
      grid[y][x].p_ups = ""
      if (powUpEl) powUpEl.classList.add("float-up");

      if (id === currentPlayer) {
        const label = powerUpMessages[grid[y][x].p_ups] || "+1 Power-Up";
        const px = x*48;
        const py = y*48 + 24;
        showFloatingText(px, py, label);
      }

      grid[y][x].p_ups = "";
    }
  }
}

function drawBombs(bombs) {
  const grid = gameData.map.grid;
  for (const bomb of bombs) {
    const id = `bomb_${bomb.x}_${bomb.y}`;

    const existing = document.getElementById(id);

    if (existing && bomb.e) {
      renderExplosion(bomb);
      playExplosion();
      existing.remove();
    } else if (!existing) {
      const bombEl = document.createElement("div");
      bombEl.className = "tile b";
      bombEl.id = id;
      bombEl.style.gridRowStart = bomb.y + 1;
      bombEl.style.gridColumnStart = bomb.x + 1;
      bombLayer.appendChild(bombEl);
      playBombPlace();
      grid[bomb.y][bomb.x].typ = TileBomb
    }
  }

  for (let i = bombs.length - 1; i >= 0; i--) {
    if (bombs[i].e) {
      bombs.splice(i, 1);
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
  updatePlayerHUD(gameData.players);
  // Schedule next frame
  animationFrameId = requestAnimationFrame(renderLoop);
}

const validKeys = [
  "ArrowUp",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "w",
  "a",
  "s",
  "d",
  "W",
  "A",
  "S",
  "D",
  " ",
  "Space",
];
const keysPressed = [];

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
        action: "game",
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
    keysPressed.splice(index, 1); // Remove the key

    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.sendMessage({
        action: "game",
        player_name: currentPlayer,
        content: JSON.stringify(keysPressed),
      });
    }
  }
}

export function stopGameApp(winnerName = "") {
  if (winnerName === currentPlayer) {
    stopBackgroundMusic();
    playVictory();
  } else {
    stopBackgroundMusic();
    playDefeat();
  }

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
    clearPlayerHUD();
  }, 3000); 
}

export function updateGameMini(data) {
  gameData.ticks = data.t;

  const incomingIds = new Set(Object.keys(data.p));
  for (const id in gameData.players) {
    if (!incomingIds.has(id)) {
      const el = document.getElementById(`player_${id}`);
      if (el) el.remove();
      delete gameData.players[id];
    }
  }

  for (const [id, miniPlayer] of Object.entries(data.p)) {
    const oldLives = gameData.players[id].lives;
    
    if (miniPlayer.l < oldLives) {
      console.log(`Player ${id} lost a life! ${oldLives} → ${miniPlayer.l}`);
      if (id === currentPlayer) {
        playDeath(); // Only YOU hear your own death sound
        showFloatingText(miniPlayer.x, miniPlayer.y - 24, '-1 ❤️');
      }
    }
    
    gameData.players[id].x = miniPlayer.x;
    gameData.players[id].y = miniPlayer.y;
    gameData.players[id].dir = miniPlayer.d;
    gameData.players[id].lives = miniPlayer.l; 
    gameData.players[id].state = miniPlayer.s;
  }

  const updatedBombs = [];

  for (const newBomb of data.b) {
    const match = gameData.map.bombs.find(
      (b) => b.x === newBomb.x && b.y === newBomb.y
    );
    if (match) {
      Object.assign(match, newBomb); // update existing bomb
      updatedBombs.push(match);
    } else {
      updatedBombs.push(newBomb); // add new bomb
    }
  }

  for (const oldBomb of gameData.map.bombs) {
    const stillExists = data.b.some(
      (b) => b.x === oldBomb.x && b.y === oldBomb.y
    );
    if (!stillExists) {
      oldBomb.e = true;
      updatedBombs.push(oldBomb);
    }
  }
  gameData.map.bombs = updatedBombs;
  
  // Smart HUD update - only updates when lives actually change
}

function renderExplosion(bomb) {
  const grid = gameData.map.grid;

  const { x, y, r } = bomb;
  const width = grid[0].length;
  const height = grid.length;
  grid[y][x].typ = TileFlame;

  const tiles = [];
  tiles.push({ x, y });

  const directions = [
    { dx: 0, dy: -1 }, // up
    { dx: 0, dy: 1 }, // down
    { dx: -1, dy: 0 }, // left
    { dx: 1, dy: 0 }, // right
  ];

  for (const { dx, dy } of directions) {
    for (let i = 1; i <= r; i++) {
      const nx = x + dx * i;
      const ny = y + dy * i;

      if (nx < 0 || ny < 0 || nx >= width || ny >= height) break;
      const tileType = grid[ny][nx].typ;

      if (tileType === TileWall || tileType == TileBomb) {
        break;
      } else if (tileType === TileBlock) {
        grid[ny][nx].typ = TileDestroy;
        const blockEl = document.getElementById(`block_${nx}_${ny}`);
        if (blockEl) blockEl.classList.add("hidden");
        tiles.push({ x: nx, y: ny });
        break;
      } else if (
        tileType === TileEmpty ||
        tileType == TileFlame ||
        tileType == TileDestroy
      ) {
        grid[ny][nx].typ = TileFlame;
        tiles.push({ x: nx, y: ny });

        if (grid[ny][nx].p_ups !== "") {
          const powUpEl = document.getElementById(`powup_${nx}_${ny}`);
          if (powUpEl) powUpEl.remove();
          grid[ny][nx].p_ups = "";
        }
      }
    }
  }

  for (const tile of tiles) {
    const { x, y } = tile;
    flameGrid[y][x]++;
    let flame = document.getElementById(`flame_${x}_${y}`);

    if (!flame) {
      flame = document.createElement("div");
      flame.className = "tile f";
      flame.style.gridRowStart = y + 1;
      flame.style.gridColumnStart = x + 1;
      flame.id = `flame_${x}_${y}`;
      exploLayer.appendChild(flame);
    } else {
      flame.classList.remove("f");
      void flame.offsetWidth;
      flame.classList.add("f");
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
        grid[y][x].typ = TileEmpty;
      }
    }
  }, 450);
}

function showFloatingText(x, y, text) {
  const floatText = document.createElement("div");
  floatText.className = "floating-text";
  floatText.textContent = text;
  floatText.style.left = `${x}px`;
  floatText.style.top = `${y}px`;

  gameRoot.appendChild(floatText);

  setTimeout(() => floatText.remove(), 1000);
}

// Create HUD with player info
function createPlayerHUD(players) {
  console.log('[HUD] Creating HUD for players:', Object.keys(players));
  const hud = document.getElementById('player-hud');
  if (!hud) {
    console.error('[HUD] player-hud element not found!');
    return;
  }
  
  // Clear existing content
  hud.innerHTML = '';
  
  // Add each player's info
  Object.keys(players).forEach(id => {
    const player = players[id];
    console.log(`[HUD] Adding player: ${player.name} (${player.col}) - Lives: ${player.lives}`);
    
    const playerDiv = document.createElement('div');
    playerDiv.className = `player-info ${player.col}`;
    playerDiv.innerHTML = `
      <div class="player-name">${player.name}</div>
      <div class="player-lives">${generateHearts(player.lives)}</div>
    `;
    hud.appendChild(playerDiv);
  });
  
  // Update tracking object
  previousLives = {};
  Object.keys(players).forEach(id => {
    previousLives[id] = players[id].lives;
  });
  
  console.log('[HUD] HUD created successfully');
}

// Update HUD with current player data - only if lives changed
function updatePlayerHUD(players) {

  
  let hasChanges = false;
  
  // Check if lives changed for any player
  Object.keys(players).forEach(id => {
    if (previousLives[id] !== players[id].lives) {
      console.log(`[HUD] Lives changed for ${players[id].name}: ${previousLives[id]} -> ${players[id].lives}`);
      hasChanges = true;
    }
  });
  
  // Check if new players joined or left
  const currentPlayerIds = Object.keys(players);
  const previousPlayerIds = Object.keys(previousLives);
  if (currentPlayerIds.length !== previousPlayerIds.length) {
    console.log('[HUD] Player count changed');
    hasChanges = true;
  }
  
  // Only update if there are actual changes
  if (hasChanges) {
    console.log('[HUD] Updating HUD due to changes');
    createPlayerHUD(players);
  }
}

// Clear HUD
function clearPlayerHUD() {
  console.log('[HUD] Clearing HUD');
  const hud = document.getElementById('player-hud');
  if (hud) {
    hud.innerHTML = '';
  }
  
  // Reset tracking
  previousLives = {};
}
