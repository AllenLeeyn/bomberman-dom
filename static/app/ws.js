import { state } from "./store.js"
import { connectWebSocket, getSocket } from '../framework/domber.js'
import { launchGame, updateGameState, updateGameMini, stopGameApp } from './routes/game.js';
import { setTimerState } from "./timer.js";

export function joinLobby(name) {
  if (!name) {
    state.errorMessage = 'Please enter a nickname.';
    return;
  }

  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const host = window.location.host;

  connectWebSocket('lobby', `${protocol}//${host}/ws?name=${encodeURIComponent(name)}`, {
    onOpen: () => {
      state.playerName = name;
      state.connected = true;
      state.errorMessage = '';
    },
    onError: () => {
      state.errorMessage = 'Failed to connect. Name might be taken or lobby full.';
    },
    onClose: () => {
      state.connected = false;
      state.players = [];
      state.messages.push({ text: 'Disconnected from server.', system: true });
    },
    onMessage: handleMessage,
  });
};

export function sendMessage(msg) {
  if (!msg) return;

  const socket = getSocket('lobby');
  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.sendMessage({ content: msg });
  }
};

export function sendColorChange() {
  const socket = getSocket('lobby');
  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.sendMessage({ action: "colorChange" });
  }
};

function safeParse(data) {
  try {
    return JSON.parse(data);
  } catch {
    return data;
  }
};

async function checkStatus(url) {
  try {
    const res = await fetch(`${url}/status`, { cache: "no-store" });
    const data = await res.json();
    return data.status === 'free';
  } catch (e) {
    return false;
  }
}

async function handleMessage(event) {
  const data = safeParse(event.data);
  if (data.action === "game_mini"){
    updateGameMini(data)

  } else if (data.action === "game_end"){
    setTimeout(() => {
    stopGameApp(data.winner)
    }, 200); 
    setTimeout(() => {
      state.state = 'in_lobby';
    }, 3000); 
    
    const SpectatingOverlay = document.getElementById("SpectatingOverlay");
    if (SpectatingOverlay) SpectatingOverlay.remove();

  } else if (data.action === "game_update"){
    state.state = 'in_game';
    launchGame(data, state.playerName);
    const gameRoot = document.getElementById('game-root');
    const SpectatingOverlay = document.createElement("div");
    SpectatingOverlay.id = "SpectatingOverlay";
    SpectatingOverlay.className = "spectating-overlay";
    SpectatingOverlay.textContent = `Spectating`;
    gameRoot.appendChild(SpectatingOverlay);

  } else if (data.action === "game_start"){
    state.state = 'in_game';
    launchGame(data, state.playerName);

  } else if (data.action === 'reject') {
    state.errorMessage = data.reason || 'Connection rejected.';

    if (data.reason == "lobby is full. looking for new server") {
      const serverList = [
        'http://localhost:8080',
        'https://bomberman-dom-4lnj.onrender.com',
        'https://bomberman-dom-1.onrender.com',
        'https://bomberman-dom-2.onrender.com',
        'https://bomberman-dom-3.onrender.com',
        'https://bomberman-dom-4.onrender.com',
        'https://bomberman-dom-6.onrender.com',
        'https://bomberman-dom-7.onrender.com',
        'https://bomberman-dom-8.onrender.com',
      ];
      const currentOrigin = window.location.origin;
      const nextServers = serverList.filter(url => url !== currentOrigin);
      for (const next of nextServers) {
        const isFree = await checkStatus(next);
        if (isFree) {
          state.errorMessage = "server full. redirecting..."
          setTimeout(() => {
            window.location.href = next;
          }, 3000);
          return;
        }
      }
      
      // If all are full, show message
      document.body.innerHTML = `
        <div class="server-full-message">
          <h2>🚫 All servers are currently full.</h2>
          <p>Please try again later.</p>
        </div>
      `;
    }

  } else if (data.action === 'timer') {
    setTimerState(data.state, data.duration);

  }else if (data.action === 'join' || data.action === "colorChange") {
    handleJoin(data)

  } else if (data.action === 'offline') {
    handleOffline(data)
    
  } else if (data.player_name && data.content) {
    if (data.player_name === state.playerName) {
      state.msgInput = '';
    }
    state.messages.push({ name: data.player_name, text: data.content });
  }
};

function handleJoin(data) {
    const players = [];
    const names = data.allPlayersNames || [];
    const colors = data.allPlayerColors || [];

    for (let i = 0; i < names.length; i++) {
      players.push({ name: names[i], color: colors[i] || 'black' });
    }
    state.players = players;
    state.messages.push({ text: 'New player joined', system: true });
}

function handleOffline(data) {
    state.messages.push({ text: `Player left: ${data.player_name}`, system: true });
    const index = state.players.findIndex(p => p.name === data.player_name);
    if (index !== -1) {
      state.players.splice(index, 1);
    }
}
