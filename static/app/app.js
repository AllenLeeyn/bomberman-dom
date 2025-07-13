import { state, subscribe } from "./store.js"
import { joinLobby, sendMessage } from "./ws.js"
import { router, update } from '../framework/domber.js'
import { LobbyScreen } from './routes/chat.js';
import { JoinScreen } from './routes/join.js';
const root = document.getElementById('app');
const gameRoot = document.getElementById('game-root');


let oldVNode = null;

function renderApp() {
  const newVNode = state.connected
    ? LobbyScreen(state, sendMessage)
    : JoinScreen(state, joinLobby);

    if (state.state === "in_game") {
      gameRoot.classList.remove('hidden');
    } else {
      gameRoot.classList.add('hidden');
    }

  oldVNode = update(root, oldVNode, newVNode);

  // Only run when JoinScreen is shown
  if (!state.connected) {
    setTimeout(() => {
      const logo = document.querySelectorAll("#logo path");
      // for (let i = 0; i < logo.length; i++) {
      //   console.log(`Element ${i}:`, logo[i]);
      //   // if (typeof logo[i].getTotalLength === "function") {
      //   //   // console.log(`Letter ${i} is ${logo[i].getTotalLength()}`);
      //   // } else {
      //   //   // console.warn(`Element ${i} does not support getTotalLength`);
      //   // }
      // }
    }, 0);
  }
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
