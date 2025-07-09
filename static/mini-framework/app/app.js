import { createStore } from '../src/store.js';
import { connectWebSocket, getSocket } from '../src/websocket.js';
import { LobbyScreen } from '../app/routes/chat.js';
import { JoinScreen } from '../app/routes/join.js';
import { router } from '../src/router.js';
import { update } from '../src/vdom.js';

const colorSet = {
  red: '#e74c3c',
  blue: '#3498db',
  green: '#27ae60',
  yellow: '#f1c40f',
  purple: '#9b59b6',
  orange: '#e67e22',
  cyan: '#1abc9c',
  pink: '#fd79a8',
};

const root = document.getElementById('app');
const { state, subscribe } = createStore({
  playerName: '',
  players: [],
  messages: [],
  msgInput: '',
  connected: false,
  errorMessage: '',
  state: 'in_lobby',
  timerDuration: 0,
});

const joinLobby = (name) => {
  if (!name) {
    state.errorMessage = 'Please enter a nickname.';
    return;
  }

  connectWebSocket('lobby', `ws://${location.host}/ws?name=${encodeURIComponent(name)}`, {
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

const sendMessage = (msg) => {
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
  const data = safeParse(event.data);

  if (data.action === 'reject') {
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

    state.messages.push({ text: 'Player joined', system: true });

  } else if (data.action === 'offline') {
    state.messages.push({ text: `Player left: ${data.id}`, system: true });

    const index = state.players.findIndex(p => p.name === data.id);
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

let oldVNode = null;
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

function renderApp() {
  const newVNode = state.connected
    ? LobbyScreen(state, sendMessage)
    : JoinScreen(state, joinLobby);

  oldVNode = update(root, oldVNode, newVNode);
}

router.addRoute('', () => renderApp());
router.setNotFoundHandler(() => {
  console.warn('[router] Unknown route. Redirecting to /join...');
  router.navigate(''); // 🔁 redirect
  return {
    tag: 'div',
    children: ['Redirecting to root...']
  };
});

renderApp();
subscribe(renderApp);

router.start();
