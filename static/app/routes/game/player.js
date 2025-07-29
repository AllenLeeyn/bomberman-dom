
import { showFloatingText } from './hud.js';
import { playPowerup } from '../../sound.js';
import { currentPlayer } from '../game.js';

const TileEmpty = "e";
const TileSize = 48;
const PlayerSize = 36;

const powerUpMessages = {
  bombUp: "+1 Bomb",
  flameUp: "+1 Range",
  speedUp: "+1 Speed",
  bombPass: "Bomb Pass",
  blockPass: "Block Pass",
  liveUp: "+1 Life",
};

export function createPlayers(players, playerLayer, curPlayer) {
  for (const id in players) {
    const player = players[id];
    const el = document.createElement("div");
    el.className = `player`;
    el.id = `player_${id}`;

    if (id === curPlayer) {
      const arrow = document.createElement('div');
      arrow.className = 'player-arrow';
      el.appendChild(arrow);
    }
    el.style.transform = `translate(${player.x}px, ${player.y}px)`;

    const directions = ['front', 'back', 'left', 'right', 'dead'];
    directions.forEach(dir => {
      const img = document.createElement('img');
      img.src = `./static/app/assets/bot_${player.col}_${dir}.png`;
      img.className = `player-img dir-${dir}`;
      img.style.display = dir === "front" ? "" : "none";
      el.appendChild(img);
    });
    playerLayer.appendChild(el);
  }
}

export function drawPlayers(players, grid) {  
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

    if (player.state === "rs") {
      el.classList.add("flicker");

    } else if (player.state === 'dd') {
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

    } else if (player.state === 'gh') {
      el.classList.remove("flicker");
      el.style.opacity = "50%";

    } else if (player.state === 'gr') {
      el.classList.add("ghosst-flicker");
      el.style.opacity = "50%";

    } else {
      el.style.opacity = "100%";
      el.classList.remove("flicker");
    } 

    imgs.forEach((img) => {
      if (img.classList.contains(`dir-${activeDir}`)) {
        img.style.display = "";
      } else {
        img.style.display = "none";
      }
    });

    let y = player.dir === "u" ? playerTileTop: playerTileBottom;
    let x = player.dir === "r" ? playerTileRight: playerTileLeft;

    if (grid[y][x].p_ups !== "" && grid[y][x].typ === TileEmpty ) {
      const powUpEl = document.getElementById(`powup_${x}_${y}`);
      if (powUpEl) {
          playPowerup();
          setTimeout(() => {
            powUpEl.remove();
          }, 500);
          powUpEl.classList.add("float-up")
      }

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
