const TileBlock = "bl";

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
