import { state, subscribe } from "./store.js"
import { joinLobby, sendMessage } from "./ws.js"
import { router, update } from '../framework/domber.js'
import { LobbyScreen } from './routes/chat.js';
import { JoinScreen } from './routes/join.js';
import { load, getAsset } from "./assetManager.js";

const root = document.getElementById('app');
const gameRoot = document.getElementById('game-root');

let oldVNode = null;

const assetList = [
  { key: 'w', path: 'static/app/assets/pikachu-meme.gif' },
];

  // { key: 'TileEmpty', path: 'assets/TileEmpty.png' },
  // { key: 'TileBlock', path: 'assets/TileBlock.png' },
  // { key: 'TileBomb', path: 'assets/TileBomb.png' },
  // { key: 'Player', path: 'assets/Player.png' },
  // { key: 'GameMusic', path: 'assets/background.mp3' },

function renderApp() {
  const newVNode = state.connected
    ? LobbyScreen(state, sendMessage)
    : JoinScreen(state, joinLobby);
    
    if (state.state === "in_game") {
      document.body.classList.add('in-game');
      gameRoot.classList.remove('hidden');
    } else {
      document.body.classList.remove('in-game');
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

async function initApp() {
  root.innerHTML = `<div class="loading-screen">Loading assets, please wait...</div>`;

  try {
    await load(assetList, (progress, key) => {
      console.log(`Loaded ${key} (${Math.floor(progress * 100)}%)`);
    });
  } catch (err) {
    console.error("Failed to load assets:", err);
    root.innerHTML = `<div class="error-message">An error occurred while loading assets. Try refreshing the page.</div>`;
    return;
  }

  console.log("All assets loaded — booting game...");

  // Start your app only after assets are loaded
  router.addRoute('', () => renderApp());

  router.setNotFoundHandler(() => {
    console.warn('[router] Unknown route. Redirecting to /join...');
    router.navigate('');
    return {
      tag: 'div',
      children: ['Redirecting to root...']
    };
  });

  renderApp();
  subscribe(renderApp);
  router.start();
}

initApp();

// router.addRoute('', () => renderApp());
// router.setNotFoundHandler(() => {
//   console.warn('[router] Unknown route. Redirecting to /join...');
//   router.navigate(''); // 🔁 redirect
//   return {
//     tag: 'div',
//     children: ['Redirecting to root...']
//   };
// });

// renderApp();
// subscribe(renderApp);

// router.start();


