import { state, subscribe } from "./store.js"
import { joinLobby, sendMessage, sendColorChange } from "./ws.js"
import { router, update } from '../framework/domber.js'
import { LobbyScreen } from './routes/chat.js';
import { JoinScreen } from './routes/join.js';
import { startLobbyMusic } from './sound.js';
const root = document.getElementById('app');
const gameRoot = document.getElementById('game-root');

let oldVNode = null;
let prevState = null;

function renderApp() {

  if (state.state !== "in_game") {
    if (prevState === "in_game") {
      startLobbyMusic(true); // restart from 0
    } else {
      startLobbyMusic(false); // continue if already playing
    }
  }

  const newVNode = state.connected
    ? LobbyScreen(state, sendMessage, sendColorChange)
    : JoinScreen(state, joinLobby);
    
    if (state.state === "in_game") {
      document.body.classList.add('in-game');
      gameRoot.classList.remove('hidden');
      root.classList.add('hidden');
    } else {
      document.body.classList.remove('in-game');
      gameRoot.classList.add('hidden');
      root.classList.remove('hidden');
    }

  oldVNode = update(root, oldVNode, newVNode);
  prevState = state.state;
}

router.addRoute('', () => renderApp());
router.setNotFoundHandler(() => {
  console.warn('[router] Unknown route. Redirecting to /join...');
  router.navigate(''); // redirect
  return {
    tag: 'div',
    children: ['Redirecting to root...']
  };
});

renderApp();
subscribe(renderApp);

router.start();
