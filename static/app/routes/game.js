import { getSocket } from '../../framework/domber.js'
import { useLayers, renderTileLayer, createBombPool, createExplosionPool } from '../layers.js';
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

const TileEmpty = "e";
const TileWall = "w";
const TileBlock = "bl";
const TileBomb = "b";
const TileDestroy = "d";
const TilePowerUp = "p";
const TileFlame = "f";

let bombPool = [];
let powerUp = [];
let exploPool = [];
let explosionActiveSlots = [];

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



  // drawTiles(gameData)
  const board = assets.getAsset('board');
  const player = assets.getAsset('player');
  const bomb = assets.getAsset('b');
  const explo = assets.getAsset('boom');
  // const powerUp = assets.getAsset('')

  if (!board) {
    console.error('Missing board asset!');
    return;
  }
  if (!player) {
    console.error('Missing player asset!');
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
  // if (!powerUp) {
  //   console.error('Missing power-up asset!');
  //   return;
  // }

  bombPool = createBombPool(layers.bombLayer, 12, bomb.src);
  exploPool = createExplosionPool(layers.exploLayer, 80, explo.src)
  explosionActiveSlots = exploPool.map(() => null);
  // powerUp = 

  renderTileLayer(layers.tileLayer, board.src);
  drawTiles(gameData, layers.blockLayer, layers.bombLayer);
  createPlayers(layers.playerLayer, gameData.players, player.src);

  // drawPowerUps(gameData.map.p_ups)

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

  //blockLayer.innerHTML = '';

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
          // More cases as you add more tile types (power-ups, flames, etc.)

          if (gameData.map.grid[y][x].p_ups !== "") {
            const powerUp = document.createElement('div');
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

function createPlayers(playerLayer, players, playerImgUrl) {
  playerLayer.innerHTML = '';
  for (const id in players) {
    const player = players[id];
    const el = document.createElement('div');
    el.className = `player`;
    el.id = `player_${id}`;

    el.style.transform = `translate(${player.x}px, ${player.y}px)`;

    // Validate color or fallback to 'blue'
    const allowedColors = ['red', 'blue', 'green', 'yellow'];
    const color = allowedColors.includes(player.col) ? player.col : 'blue';

    // Create images for each direction
    const directions = ['front', 'back', 'left', 'right'];
    directions.forEach(dir => {
      const img = document.createElement('img');
      img.src = `./static/app/bot_${color}_${dir}.png`;
      img.className = `player-img dir-${dir}`;
      img.style.display = (dir === 'front') ? '' : 'none';
      el.appendChild(img);
    });

    playerLayer.appendChild(el);
  }
}
<<
function drawPlayers(players) {
  const grid = gameData.map.grid

  for (const id in players) {
    const player = players[id];
    const el = document.getElementById(`player_${id}`);

    const newTransform = `translate(${player.x}px, ${player.y}px)`;

    if (el.style.transform !== newTransform) {
      el.style.transform = newTransform;
    }

    el.style.display = (player.state === "dd") ? "none" : "block";
>>
    if (player.state === "rs") {
      el.classList.add("flicker");
    } else {
      el.classList.remove("flicker");
    }

    const playerTileTop = Math.floor(player.y / TileSize)
    const playerTileBottom = Math.floor((player.y + PlayerSize - 1) / TileSize)
    const playerTileLeft = Math.floor(player.x / TileSize)
    const playerTileRight = Math.floor((player.x + PlayerSize - 1) / TileSize)

    const dirMap = {
      u: "back",
      d: "front",
      l: "left",
      r: "right",
    };

    const activeDir = dirMap[player.dir]
    const imgs = el.querySelectorAll(".player-img");
    imgs.forEach(img => {
      if (img.classList.contains(`dir-${activeDir}`)) {
        img.style.display = "";
      } else {
        img.style.display = "none";
      }
    });

    let y = playerTileBottom
    let x = playerTileLeft

    if (player.dir == "u") {
      y = playerTileTop
      x = playerTileLeft

    } else if (player.dir == "r") {
      y = playerTileTop
      x = playerTileRight
    }

    if (grid[y][x].p_ups !== "") {
      const powUpEl = document.getElementById(`powup_${x}_${y}`);
      if (powUpEl) powUpEl.remove();
      grid[y][x].p_ups = ""
    }
  }
}

function drawBombs(bombs, activeBombs) {
  // offscreen
  bombPool.forEach(img => {
    img.style.left = '-9999px';
    img.style.top = '-9999px';
  });

  // Then, put only the active ones in the right place
  activeBombs.forEach((bomb, idx) => {
    if (bombPool[idx]) {
      const img = bombPool[idx];
      img.style.left = (bomb.x * 48) + 'px';
      img.style.top = (bomb.y * 48) + 'px';
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

  drawPlayers(layers.playerLayer, gameData.players);

  const currentBombs = gameData.map.bombs || [];
  // Detect exploded bombs
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

  // Force replay: This always restarts the GIF animation in all browsers
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


