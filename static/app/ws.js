import { state } from "./store.js"
import { connectWebSocket, getSocket } from '../framework/domber.js'
import { startGameApp, updateGameState, updateGameMini, stopGameApp } from './routes/game.js';

export const joinLobby = (name) => {
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

export const sendMessage = (msg) => {
  if (!msg) return;

  const socket = getSocket('lobby');
  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.sendMessage({ content: msg });
  }
};

const safeParse = (data) => {
  try {
    return JSON.parse(data);
  } catch {
    return data;
  }
};

const handleMessage = (event) => {
  //const dataSizeBytes = new TextEncoder().encode(event.data).length;
  //console.log(`event.data size: ${dataSizeBytes} bytes`);

  const data = safeParse(event.data);
  if (data.action === "game_mini"){
    updateGameMini(data)

  } else if (data.action === "game_end"){
    stopGameApp(data.winner)
    setTimeout(() => {
      state.state = 'in_lobby';
    }, 2000); 

  } else if (data.action === "game_update"){
    updateGameState(data)

  } else if (data.action === "game_start"){
    state.state = 'in_game';
    startGameApp(data, state.playerName);

  } else if (data.action === 'reject') {
    state.errorMessage = data.reason || 'Connection rejected.';

  } else if (data.action === 'timer') {
    setTimerState(data.state, data.duration);

  }else if (data.action === 'join') {
    const players = [];
    const names = data.allPlayersNames || [];
    const colors = data.allPlayerColors || [];

    for (let i = 0; i < names.length; i++) {
      players.push({ name: names[i], color: colors[i] || 'black' });
    }
    state.players = players;
    state.messages.push({ text: 'New player joined', system: true });

  } else if (data.action === 'offline') {
    state.messages.push({ text: `Player left: ${data.player_name}`, system: true });
    const index = state.players.findIndex(p => p.name === data.player_name);
    if (index !== -1) {
      state.players.splice(index, 1); // triggers reactivity
    }
    
  } else if (data.player_name && data.content) {
    if (data.player_name === state.playerName) {
      state.msgInput = '';
    }
    state.messages.push({ name: data.player_name, text: data.content });
  }
};

let timerInterval = null;

function setTimerState(newState, duration) {
  if (state.state ===  'in_game') return;

  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }

  state.state = newState;
  state.timerDuration = duration;

  timerInterval = setInterval(() => {
    if (state.timerDuration > 0) {
      state.timerDuration--;
    } else {
      clearInterval(timerInterval);
      timerInterval = null;
      if (state.state === 'starting') {
        state.state = 'in_game';
      }
    }
  }, 1000);
}