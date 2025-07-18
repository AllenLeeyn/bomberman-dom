import { getSocket } from '../../framework/domber.js'
import { useLayers, renderTileLayer, createBombPool } from '../layers.js';
import assets from "../assets.js";
import gameAssetList from "../gameAssets.js";

const gameRoot = document.getElementById('game-root');
const tileLayer = document.getElementById('tile-layer');
const bombLayer = document.getElementById('bomb-layer');
const blockLayer = document.getElementById('block-layer');
const exploLayer = document.getElementById('explosion-layer');
const playerLayer = document.getElementById('player-layer');

const layers = useLayers(gameRoot);

const TileEmpty = "e";
const TileWall = "w";
const TileBlock = "bl";
const TileBomb = "b";
const TileDestroy = "d";
const TilePowerUp = "p";
const TileFlame = "f";

let bombPool = [];

let socket = null;
let currentPlayer = "";
let gameData = {};
let animationFrameId = null;

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
  console.warn(gameData)
  currentPlayer = playerName

  gameRoot.setAttribute('tabindex', '0');
  gameRoot.focus();

  gameRoot.addEventListener('keydown', handleKeyDown, { passive: false });
  gameRoot.addEventListener('keyup', handleKeyUp);


  // drawTiles(gameData)
  const board = assets.getAsset('board');
  const player = assets.getAsset('player');
  const bomb = assets.getAsset('b');
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
  bombPool = createBombPool(layers.bombLayer, 12, bomb.src);
  renderTileLayer(layers.tileLayer, board.src);
  drawTiles(gameData, layers.blockLayer, layers.bombLayer);
  createPlayers(layers.playerLayer, gameData.players, assets.getAsset('player').src);

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

  blockLayer.innerHTML = '';

  const gridWidth = gameData.map.w || 15;
  const gridHeight = gameData.map.h || 13;

  for (let y = 0; y < gridHeight; y++) {
    for (let x = 0; x < gridWidth; x++) {
      const cell = gameData.map.grid[y][x];
      
      switch (cell.typ) {
        case TileBlock: { // 'bl'
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

        // default: { // Default for empty/floor/unknown types
        //   const div = document.createElement('div');
        //   div.className = 'tile e';
        //   div.style.gridRowStart = y + 1;
        //   div.style.gridColumnStart = x + 1;
        //   tileLayer.appendChild(div);
        //   break;
        }
      }
    }
  }
// }


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
    const img = document.createElement('img');
    img.src = playerImgUrl;
    img.style.position = "absolute";
    img.style.width = "50px";
    img.style.height = "50px";
    img.className = 'player-img player ' + player.col;
    img.id = `player_${id}`;
    playerLayer.appendChild(img);
  }
}

function drawPlayers(playerLayer, players) {
  for (const id in players) {
    const player = players[id];
    const img = document.getElementById(`player_${id}`);
    if (img) {
      img.style.left = player.x + "px";
      img.style.top = player.y + "px";
    }
  }
}

function drawBombs(bombPool, activeBombs) {
  if (!bombPool || !bombPool.forEach) {
    console.log('drawBombs check')
    return;
  }
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
          img.style.top  = (bomb.y * 48) + 'px';
      }
  });
}


export function updateGameState(data) {
  console.log(data)
  gameData = data;
}

// Rendering function
function renderLoop() {
  if (!gameData || !gameRoot) return;


  drawPlayers(layers.playerLayer, gameData.players);
  drawBombs(bombPool, gameData.map.bombs); // update bombs

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
    if (!gameData.players[id]) continue; // skip updates for missing players
    gameData.players[id].x = miniPlayer.x;
    gameData.players[id].y = miniPlayer.y;
    gameData.players[id].dir = miniPlayer.d;
    //gameData.players[id].keys_pressed = miniPlayer.k;
    gameData.players[id].lives = miniPlayer.l;
    gameData.players[id].state = miniPlayer.s;
  }

  gameData.map.bombs = data.b;
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