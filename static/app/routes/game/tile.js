const TileBlock = "bl";
const TileWall = "w";
const TileSpike = "s";

export function drawTiles(gameData, layers) {
  
  if (!gameData.map || !Array.isArray(gameData.map.grid)) {
    console.error("drawTiles: missing or invalid gameData.map/grid", gameData.map);
    return;
  }

  const gridWidth = gameData.map.w || 15;
  const gridHeight = gameData.map.h || 13;

  for (let y = 0; y < gridHeight; y++) {
    for (let x = 0; x < gridWidth; x++) {
      if (gameData.map.grid[y][x].typ === TileBlock) {
        const block = document.createElement("div");
        block.id = `block_${x}_${y}`;
        block.className = "tile bl";
        block.style.gridRowStart = y + 1;
        block.style.gridColumnStart = x + 1;
        layers.blockLayer.appendChild(block);
      }

      if (gameData.map.grid[y][x].p_ups !== "") {
        const powerUp = document.createElement("div");
        const type = gameData.map.grid[y][x].p_ups;
        powerUp.id = `powup_${x}_${y}`;
        powerUp.className = `tile p p-${type}`;
        powerUp.style.gridRowStart = y + 1;
        powerUp.style.gridColumnStart = x + 1;
        powerUp.style.display = "none";
        layers.tileLayer.appendChild(powerUp);
      }
    }
  }
}

export function drawSpikeMap(level, gameData) {
  const rowStart = level;
  const rowEnd = gameData.map.w - level - 1;
  const colStart = level;
  const colEnd = gameData.map.h - level - 1;

  for (let y = colStart; y <= colEnd; y++) {
    spikeTile(y, rowStart, gameData);
    spikeTile(y, rowEnd, gameData);
  }
  for (let x = rowStart; x <= rowEnd; x++) {
    spikeTile(colStart, x, gameData);
    spikeTile(colEnd, x, gameData);
  }
}

function spikeTile(y, x, gameData) {
  const grid = gameData.map.grid
  const tile = grid[y][x];
  if (tile.typ === TileWall || tile.typ === TileSpike) {
    return;
  }

  if (tile.typ === TileBlock) {
    const blockEl = document.getElementById(`block_${x}_${y}`);
    if (blockEl) blockEl.classList.add('hidden');
  }
  if (tile.p_ups !== "") {
    const powUpEl = document.getElementById(`powup_${x}_${y}`);
    if (powUpEl) powUpEl.remove();
    grid[y][x].p_ups = "";
  }
  tile.typ = TileSpike;

  const spikeEl = document.createElement('div');
  spikeEl.className = 'spike';
  spikeEl.style.gridColumn = x + 1;
  spikeEl.style.gridRow = y + 1;
  document.getElementById('spike-layer').appendChild(spikeEl);
}

export function drawSpikeWarning(level, gameData) {
  const tiles = [];
  const rowStart = level;
  const rowEnd = gameData.map.w - level - 1;
  const colStart = level;
  const colEnd = gameData.map.h - level - 1;

  for (let y = colStart; y <= colEnd; y++) {
    warnTile(y, rowStart, gameData);
    warnTile(y, rowEnd, gameData);
  }
  for (let x = rowStart; x <= rowEnd; x++) {
    warnTile(colStart, x, gameData);
    warnTile(colEnd, x, gameData);
  }

  return tiles;
}

function warnTile(y, x, gameData) {
  const grid = gameData.map.grid
  const tile = grid[y][x];
  if (tile.typ === TileWall) {
    return;
  }
  const warnEl = document.getElementById(`warn${x}_${y}`);
  if (!warnEl) {
    const tileEl = document.createElement('div');
    tileEl.id = `warn${x}_${y}`;
    tileEl.classList.add("spike-warning");
    tileEl.style.gridColumn = x + 1;
    tileEl.style.gridRow = y + 1;
    document.getElementById('spike-layer').appendChild(tileEl);
    setTimeout(() => {
      tileEl.remove();
    }, 2500);
  }
}