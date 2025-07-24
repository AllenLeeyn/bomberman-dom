import { state, subscribe } from "./store.js"
import { joinLobby, sendMessage } from "./ws.js"
import { router, update } from '../framework/domber.js'
import { LobbyScreen } from './routes/chat.js';
import { JoinScreen } from './routes/join.js';
import { startLobbyMusic, stopLobbyMusic, fadeOutLobbyMusic } from './sound.js';
const root = document.getElementById('app');
const gameRoot = document.getElementById('game-root');


let oldVNode = null;
let prevState = null;

function renderApp() {

  
  if ((state.state === "in_game" && prevState !== "in_game")) {
    fadeOutLobbyMusic(9000); 
  }

  if (state.state === "in_game") {
    stopLobbyMusic();
  } else {
    if (prevState === "in_game") {
      // returned from game, restart music
      startLobbyMusic(true); // pass true to force reset
    } else {
      startLobbyMusic(false); // don't reset
    }
  }



  const newVNode = state.connected && state.state !== 'in_game'
    ? LobbyScreen(state, sendMessage)
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
  prevState = state.state;
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
