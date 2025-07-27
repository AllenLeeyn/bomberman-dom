import { layers, bombPool, exploPool, flameGrid } from "../game.js";
import { 
  playBombPlace, 
  playExplosion,
} from '../../sound.js';

const TileEmpty = "e";
const TileWall = "w";
const TileBlock = "bl";
const TileBomb = "b";
const TileDestroy = "d";
const TileFlame = "f";

let bombPoolIndex = 0;
export function drawBombs(bombs, grid) {
  for (const bomb of bombs) {
    const id = `bomb_${bomb.x}_${bomb.y}`;
    const existing = document.getElementById(id);

    if (existing && bomb.e) {
      existing.id = '';
      existing.style.display = 'none';
      existing.className = '';
      layers.poolLayer.appendChild(existing)
      renderExplosion(bomb, grid);
      playExplosion();
      
    } else if (!existing) {
      const bombEl = bombPool[bombPoolIndex];
      bombPoolIndex = (bombPoolIndex + 1) % bombPool.length;
      bombEl.id = id;
      bombEl.style.gridRowStart = bomb.y + 1;
      bombEl.style.gridColumnStart = bomb.x + 1;
      bombEl.className = 'tile b';
      bombEl.style.display = '';
      grid[bomb.y][bomb.x].typ = TileBomb;
      layers.bombLayer.appendChild(bombEl);
      playBombPlace();
    }
  }

  for (let i = bombs.length - 1; i >= 0; i--) {
    if (bombs[i].e) {
      bombs.splice(i, 1);
    }
  }
}

function renderExplosion(bomb, grid) {
  const { x, y, r } = bomb;
  const width = grid[0].length;
  const height = grid.length;
  grid[y][x].typ = TileFlame;

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
        grid[ny][nx].typ = TileDestroy;
        const blockEl = document.getElementById(`block_${nx}_${ny}`);
        if (blockEl) blockEl.classList.add('hidden');
        tiles.push({ x: nx, y: ny });

        if (grid[ny][nx].p_ups !== "") {
          const powUpEl = document.getElementById(`powup_${nx}_${ny}`);
          powUpEl.style.display = "";
        }
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
    placeExplosion(tile.x, tile.y);
  }

  setTimeout(() => {
    for (const tile of tiles) {
      const { x, y } = tile;

      flameGrid[y][x]--;
      if (flameGrid[y][x] <= 0) {
        const flame = document.getElementById(`flame_${x}_${y}`);
        flame.id = ``;
        flame.style.display = 'none';
        flame.className = '';
        layers.poolLayer.appendChild(flame)
        flameGrid[y][x] = 0;
        grid[y][x].typ = TileEmpty;
      }
    }
  }, 450);
}

let exploPoolIndex = 0;
function placeExplosion(x, y) {
  flameGrid[y][x]++;
  let flame = document.getElementById(`flame_${x}_${y}`);
  
  if (!flame) {
    exploPoolIndex = (exploPoolIndex + 1) % exploPool.length;
    const exploEl = exploPool[exploPoolIndex];
    
    exploEl.id = `flame_${x}_${y}`;
    exploEl.style.gridRowStart = y + 1;
    exploEl.style.gridColumnStart = x + 1;
    exploEl.style.display = '';
    exploEl.className = 'tile f';
    layers.exploLayer.appendChild(exploEl);

  } else {
    flame.classList.remove("f");
    void flame.offsetWidth;
    flame.classList.add("f");
  }
}
