import { layers } from "../game.js";

// Track previous lives to detect changes
let previousLives = {};

// Generate hearts based on lives count
function generateHearts(lives) {
  return lives > 0 ? '❤️'.repeat(lives) : '💀';
}

// Create HUD with player info
export function createPlayerHUD(players) {
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
export function updatePlayerHUD(players) {
  let hasChanges = false;

  Object.keys(players).forEach(id => {
    if (previousLives[id] !== players[id].lives) {
      console.log(`[HUD] Lives changed for ${players[id].name}: ${previousLives[id]} -> ${players[id].lives}`);
      hasChanges = true;
    }
  });

  const currentPlayerIds = Object.keys(players);
  const previousPlayerIds = Object.keys(previousLives);
  if (currentPlayerIds.length !== previousPlayerIds.length) {
    hasChanges = true;
  }

  if (hasChanges) {
    createPlayerHUD(players);
  }
}

// Clear HUD
export function clearPlayerHUD() {
  console.log('[HUD] Clearing HUD');
  const hud = document.getElementById('player-hud');
  if (hud) {
    hud.innerHTML = '';
  }
  previousLives = {};
}

export function showFloatingText(x, y, text) {
  const floatText = document.createElement("div");
  floatText.className = "floating-text";
  floatText.textContent = text;
  floatText.style.left = `${x}px`;
  floatText.style.top = `${y}px`;

  layers.playerLayer.appendChild(floatText);

  setTimeout(() => floatText.remove(), 1000);
}