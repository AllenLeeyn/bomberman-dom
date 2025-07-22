import { getSocket } from '../../framework/domber.js'
import { useLayers, renderTileLayer, createSpritePool, createPlayerSpritePool } from '../layers.js';
import assets from "../assets.js";
import gameAssetList from "../gameAssets.js";

const gameRoot = document.getElementById('game-root');
const tileLayer = document.getElementById('tile-layer');
const bombLayer = document.getElementById('bomb-layer');
const blockLayer = document.getElementById('block-layer');
const exploLayer = document.getElementById('explosion-layer');
const playerLayer = document.getElementById('player-layer');

const layers = useLayers(gameRoot);

const TileSize = 48;
const PlayerSize = 36;
const playerColors = ['red', 'blue', 'green', 'yellow'];

const TileEmpty = "e";
const TileWall = "w";
const TileBlock = "bl";
const TileBomb = "b";
const TileDestroy = "d";
const TilePowerUp = "p";
const TileFlame = "f";

let bombPool = [];
let exploPool = [];
let explosionActiveSlots = [];
let playerSpritePool = {};
const powerUpPools = {};

const powerUpTypes = [
  'p-bombUp',
  'p-flameUp',
  'p-speedUp',
  'p-bombPass',
  'p-blockPass',
  'p-liveUp'
];

const powerUpTypeMax = {
  'p-bombUp': 7,
  'p-flameUp': 5,
  'p-speedUp': 3,
  'p-bombPass': 3,
  'p-blockPass': 3,
  'p-liveUp': 2
};

let socket = null;
let currentPlayer = "";
let gameData = {};
let animationFrameId = null;
let flameGrid = null

console.log({ tileLayer, blockLayer, bombLayer, playerLayer });

export async function launchGame(data, playerName) {
  const loadingDiv = showLoadingOverlay(gameRoot);

  try {
    await assets.load(gameAssetList, (progress, key) => {
      loadingDiv.textContent = `Loaded ${key} (${Math.round(progress * 100)}%)`;
    });
  } catch (err) {
    loadingDiv.textContent = 'Failed to load game assets!';
    return;
  }

  // After loading
  loadingDiv.parentNode.removeChild(loadingDiv); // or loadingDiv.classList.add('hidden');
  startGameApp(data, playerName);
}




export function startGameApp(data, playerName) {
  console.log("== startGameApp data ==", data);
  // clearing "existing" event
  gameRoot.removeEventListener('keydown', handleKeyDown);
  gameRoot.removeEventListener('keyup', handleKeyUp);

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

  const board = assets.getAsset('board');
  const bomb = assets.getAsset('b');
  const explo = assets.getAsset('boom');

  if (!board) {
    console.error('Missing board asset!');
    return;
  }
  if (!bomb) {
    console.error('Missing bomb asset!');
    return;
  }
  if (!explo) {
    console.error('Missing explosion asset!');
    return;
  }

  bombPool = createSpritePool(layers.bombLayer, 12, 'b', assets, 'tile bomb');
  exploPool = createSpritePool(layers.exploLayer, 80, 'boom', assets, 'tile flame');
  explosionActiveSlots = exploPool.map(() => null);
  powerUpTypes.forEach(type => {
    powerUpPools[type] = createSpritePool(
      layers.bombLayer,             // layer
      powerUpTypeMax[type],         // pool size for this type
      type,                         // asset key, example: 'p-bombUp'
      assets,                       // 
      `tile p ${type}`,             // css classes
      48, 48
    );
  });

  renderTileLayer(layers.tileLayer, board.src);
  drawTiles(gameData, layers.blockLayer, layers.bombLayer);

  playerSpritePool = createPlayerSpritePool(layers.playerLayer, 4, assets, PlayerSize);

  // TODO: Implement real game rendering logic here using gameData state
  console.log('[Game] Initialized game container with dimensions:');

  // Start render loop
  animationFrameId = requestAnimationFrame(renderLoop);
}


function showLoadingOverlay(parent) {
  let div = document.getElementById('loading-overlay');
  if (!div) {
    div = document.createElement('div');
    div.id = 'loading-overlay';
    parent.appendChild(div);
  }
  div.classList.remove('hidden');
  div.textContent = 'Loading game assets...';
  return div;
}


function drawTiles(gameData) {

  console.log("== In drawTiles ==");
  console.log("gameData.map:", gameData.map);
  console.log("gameData.map.grid:", gameData.map && gameData.map.grid);

  if (!gameData.map || !Array.isArray(gameData.map.grid)) {
    console.error("drawTiles: missing or invalid gameData.map/grid", gameData.map);
    return;
  }

  const gridWidth = gameData.map.w || 15;
  const gridHeight = gameData.map.h || 13;

  flameGrid = Array.from({ length: gridHeight }, () =>
    Array(gridWidth).fill(0)
  );

  for (let y = 0; y < gridHeight; y++) {
    for (let x = 0; x < gridWidth; x++) {
      const cell = gameData.map.grid[y][x];

      switch (cell.typ) {
        case TileBlock: { // 'bl' - Destroyable Block
          const tileBlock = assets.getAsset('bl');
          if (tileBlock && tileBlock.src) {
            const img = document.createElement('img');
            img.src = tileBlock.src;
            img.className = 'tile bl';
            img.style.gridRowStart = y + 1;
            img.style.gridColumnStart = x + 1;
            if ((x + y) % 2 === 0) img.classList.add('bl-alt');
            blockLayer.appendChild(img);
          } else {
            // fallback to div if no asset found
            const div = document.createElement('div');
            div.className = 'tile bl';
            div.style.gridRowStart = y + 1;
            div.style.gridColumnStart = x + 1;
            if ((x + y) % 2 === 0) div.classList.add('bl-alt');
            blockLayer.appendChild(div);
          }
          break;
        }
      }
    }
  }
}

function drawPowerUps(powerUpsList) {

  for (const type in powerUpPools) {
    powerUpPools[type].forEach(img => {
      img.style.left = '-9999px';
      img.style.top = '-9999px';
      img.style.display = 'none';
    });
  }

  // Show only the needed ones, from each pool
  // example input: [{x: 4, y: 3, type: "p-bombUp"}, ...]
  const poolsInUse = {};
  for (const pu of powerUpsList) {
    const type = pu.type;
    const pool = powerUpPools[type];
    if (!pool) continue;
    if (!poolsInUse[type]) poolsInUse[type] = 0;
    const idx = poolsInUse[type];

    if (pool[idx]) {
      const img = pool[idx];
      img.style.left = (pu.x * 48) + 'px';
      img.style.top = (pu.y * 48) + 'px';
      img.style.display = '';
    }
    poolsInUse[type]++;
  }
}

function collectVisiblePowerUps(grid) {
  const list = [];
  for (let y = 0; y < grid.length; y++) {
    for (let x = 0; x < grid[0].length; x++) {
      const tile = grid[y][x];
      if (tile.p_ups && tile.p_ups !== '') {
        list.push({x, y, type: tile.p_ups});
      }
    }
  }
  return list;
}


function drawPlayers(players) {
  for (const id in players) {
    const player = players[id];
    const color = playerColors.includes(player.col) ? player.col : 'blue'; // change blue to whatever default colors you want
    const dirMap = { u: "back", d: "front", l: "left", r: "right" };
    const dir = dirMap[player.dir] || "front";
    const poolKey = `${color}_${dir}`;
    const playerId = `player_${id}`;

    // Hide all sprites for this player
    for (const key in playerSpritePool[playerId]) {
      playerSpritePool[playerId][key].style.display = 'none';
    }

    // Show the correct sprite
    const img = playerSpritePool[playerId][poolKey];
    if (img) {
      img.style.left = player.x + 'px';
      img.style.top = player.y + 'px';
      img.style.display = (player.state === "dd") ? "none" : "block";
      if (player.state === "rs") {
        img.classList.add("flicker");
      } else {
        img.classList.remove("flicker");
      }
    }
  }
}

function drawBombs(bombs, activeBombs) {
  // offscreen
  bombPool.forEach(img => {
    img.style.left = '-9999px';
    img.style.top = '-9999px';
    img.style.display = 'none';
  });

  // Then, put only the active ones in the right place
  activeBombs.forEach((bomb, idx) => {
    if (bombPool[idx]) {
      const img = bombPool[idx];
      img.style.left = (bomb.x * TileSize) + 'px';
      img.style.top = (bomb.y * TileSize) + 'px';
      img.style.display = '';

      // restart GIFs 
      img.src = '';
      img.src = img.dataset.src;
    }
  });
}

export function updateGameState(data) {
  gameData = data;
}

// Rendering function
let previousBombs = [];

function renderLoop() {
  if (!gameData || !gameRoot) return;

  // players
  drawPlayers(gameData.players, assets);

  // power-up
  const visiblePowerUps = collectVisiblePowerUps(gameData.map.grid);
  drawPowerUps(visiblePowerUps);

  // bomb
  const currentBombs = gameData.map.bombs || [];
  // detect exploded bombs
  for (const prevBomb of previousBombs) {
    const stillExists = currentBombs.some(b => b.x === prevBomb.x && b.y === prevBomb.y);
    if (!stillExists) {
      renderExplosion(prevBomb);
    }
  }
  previousBombs = currentBombs.map(bomb => ({ ...bomb }));
  drawBombs(bombPool, currentBombs); // update bombs


  animationFrameId = requestAnimationFrame(renderLoop);
}

const validKeys = [
  'ArrowUp',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
  'w', 'a', 's', 'd',
  'W', 'A', 'S', 'D',
  ' ', 'Space'
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

  const incomingIds = new Set(Object.keys(data.p));
  for (const id in gameData.players) {
    if (!incomingIds.has(id)) {
      const el = document.getElementById(`player_${id}`);
      if (el) el.remove();
      delete gameData.players[id];
    }
  }

  for (const [id, miniPlayer] of Object.entries(data.p)) {
    if (!gameData.players[id]) {
      console.warn(`Skipping update for unknown player id ${id}`);
      continue;
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
}

function renderExplosion(bomb) {
  const grid = gameData.map.grid;
  const { x, y, r } = bomb;
  const width = grid[0].length;
  const height = grid.length;
  grid[y][x].typ = TileFlame

  const tiles = [];
  tiles.push({ x, y });

  const directions = [
    { dx: 0, dy: -1 },
    { dx: 0, dy: 1 },
    { dx: -1, dy: 0 },
    { dx: 1, dy: 0 }
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
        grid[ny][nx].typ = TileDestroy
        const blockEl = document.getElementById(`block_${nx}_${ny}`);
        if (blockEl) blockEl.classList.add('hidden');
        tiles.push({ x: nx, y: ny });
        break;

      } else if (tileType === TileEmpty || tileType == TileFlame ||
        tileType == TileDestroy) {
        grid[ny][nx].typ = TileFlame
        tiles.push({x: nx, y: ny});

        if (grid[ny][nx].p_ups !== "") {
          const powUpEl = document.getElementById(`powup_${nx}_${ny}`);
          if (powUpEl) powUpEl.remove();
          grid[ny][nx].p_ups = ""
        }
      }
    }
  }

  // placing the pooled explosion at each tile; 
  // check function placeExplosion for logic.
  for (const tile of tiles) {
    placeExplosion(tile.x, tile.y, 1000);
  }
}

// 
function placeExplosion(x, y, durationMs = 1000) {
  // Find a free pool slot
  const idx = explosionActiveSlots.findIndex(e => e === null);
  if (idx === -1) return; // overlimit of flames

  const img = exploPool[idx];
  img.style.left = (x * 48) + 'px';
  img.style.top = (y * 48) + 'px';
  img.style.display = '';

  // restart gif if needed
  img.src = '';
  img.src = img.dataset.src;

  // free the slot after explosion
  explosionActiveSlots[idx] = setTimeout(() => {
    img.style.left = '-9999px';
    img.style.top = '-9999px';
    img.style.display = 'none';
    explosionActiveSlots[idx] = null;
  }, durationMs);
}


