import { getSocket } from '../../../framework/domber.js'

let socket = null;
let currentPlayer = "";

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

export function AddKeyEvents(gameRoot, playerName) {
  gameRoot.removeEventListener('keydown', handleKeyDown);
  gameRoot.removeEventListener('keyup', handleKeyUp);

  socket = getSocket('lobby')
  currentPlayer = playerName;

  gameRoot.addEventListener("keydown", handleKeyDown, { passive: false });
  gameRoot.addEventListener("keyup", handleKeyUp);
}

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
    keysPressed.splice(index, 1);

    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.sendMessage({
        action: "game",
        player_name: currentPlayer,
        content: JSON.stringify(keysPressed),
      });
    }
  }
}
