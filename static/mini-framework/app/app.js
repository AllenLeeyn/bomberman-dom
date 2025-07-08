import { createStore } from '../src/store.js';
import { connectWebSocket, getSocket } from '../src/websocket.js';
import { LobbyScreen } from '../app/routes/chat.js';
import { JoinScreen } from '../app/routes/join.js';
import { router } from '../src/router.js';

const { state, subscribe } = createStore({
  playerName: '',
  players: [],
  messages: [],
  connected: false,
  errorMessage: ''
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
  if (typeof data === 'string') {
    state.messages.push({ text: data, system: true });
  } else if (data.action === 'join') {
    state.players = [...data.allPlayers];
    state.messages.push({ text: 'Player joined', system: true });
  } else if (data.action === 'offline') {
    state.messages.push({ text: `Player left: ${data.id}`, system: true });
  } else if (data.player_name && data.content) {
    state.messages.push({ name: data.player_name, text: data.content });
  }
};

const renderApp = () => {
  if (!state.connected) {
    // Show JoinScreen if not connected
    return JoinScreen(state, joinLobby);
  } else {
    // Show LobbyScreen if connected
    return LobbyScreen(state, sendMessage);
  }
};

router.addRoute('', () => renderApp());
router.setNotFoundHandler(() => {
  console.warn('[router] Unknown route. Redirecting to /join...');
  router.navigate(''); // 🔁 redirect
  return {
    tag: 'div',
    children: ['Redirecting to root...']
  };
});


subscribe(renderApp);

router.start();
