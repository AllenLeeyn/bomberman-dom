
import { useLayers, renderTileLayer, createSpritePool, clearLayers } from '../layers.js';
import assets from "../assets.js";
import gameAssetList from "../gameAssets.js";
import { drawBombs } from './game/bomb.js';
import { drawTiles } from './game/tile.js';
import { AddKeyEvents } from './game/handleKeyEvents.js';
import { createPlayerHUD, updatePlayerHUD, clearPlayerHUD, showFloatingText } from './game/hud.js';
import { createPlayers, drawPlayers } from './game/player.js';
import { isMobileDevice, initMobileControls } from '../mobile.js';
import {
  playDeath,
  startBackgroundMusic,
  stopBackgroundMusic,
  playVictory,
  playDefeat,
  stopLobbyMusic,
} from '../sound.js'

const gameRoot = document.getElementById('game-root');

export const layers = useLayers(gameRoot);
export let currentPlayer = "";
export let bombPool = [];
export let exploPool = [];
export let flameGrid = null;

let gameData = {};
let animationFrameId = null;

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

  loadingDiv.parentNode.removeChild(loadingDiv);
  stopLobbyMusic();
  startGameApp(data, playerName);
}

export function startGameApp(data, playerName) {
  if (!gameRoot) {
    console.error('[Game] Missing elements');
    return;
  }
  if (!data) {
    console.error("[Game] Invalid game data");
    return;
  }
  gameData = data;
  currentPlayer = playerName;
  flameGrid = Array.from({ length: gameData.map.h }, () =>
    Array(gameData.map.w).fill(0)
  );

  gameRoot.setAttribute("tabindex", "0");
  gameRoot.focus();
  AddKeyEvents(gameRoot, playerName)

  console.warn(isMobileDevice())
  if (isMobileDevice()) {
    initMobileControls()
  }

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

  renderTileLayer(layers.tileLayer, board.src);
  drawTiles(gameData, layers);
  createPlayers(gameData.players, layers.playerLayer)
  createPlayerHUD(gameData.players);
  startBackgroundMusic();

  bombPool = createSpritePool(layers.poolLayer, 20, 'b', assets, 'tile b');
  exploPool = createSpritePool(layers.poolLayer, 120, 'boom', assets, 'tile f');

  animationFrameId = requestAnimationFrame(renderLoop);
}

function renderLoop() {
  drawPlayers(gameData.players, gameData.map.grid);
  drawBombs(gameData.map.bombs, gameData.map.grid);
  updatePlayerHUD(gameData.players);
  animationFrameId = requestAnimationFrame(renderLoop);
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
    clearLayers(gameRoot);
    clearPlayerHUD();
  }, 3000); 
}

export function updateGameState(data) {
  gameData = data;
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
    if (!gameData.players[id]) {
      console.warn(`Skipping update for unknown player id ${id}`);
      continue;
    }
    const oldLives = gameData.players[id].lives;
    
    if (miniPlayer.l < oldLives) {
      console.log(`Player ${id} lost a life! ${oldLives} → ${miniPlayer.l}`);
      if (id === currentPlayer) {
        playDeath();
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
}
