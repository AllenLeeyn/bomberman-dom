import { state, subscribe } from "./store.js"
import { joinLobby, sendMessage, sendColorChange } from "./ws.js"
import { router, update } from '../framework/domber.js'
import { LobbyScreen } from './routes/chat.js';
import { JoinScreen } from './routes/join.js';
import { startLobbyMusic } from './sound.js';
import { isMobileDevice } from "./mobile.js";
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

setupMobileInteraction();
renderApp();
subscribe(renderApp);

router.start();

function requestFullscreen() {
  const elem = document.documentElement; // or a specific container

  if (elem.requestFullscreen) {
    elem.requestFullscreen();
  } else if (elem.webkitRequestFullscreen) { // Safari
    elem.webkitRequestFullscreen();
  } else if (elem.msRequestFullscreen) { // IE/Edge
    elem.msRequestFullscreen();
  }
}

function requestLandscape() {
  const screenOrientation = screen.orientation || screen.mozOrientation || screen.msOrientation;
  if (screenOrientation && screenOrientation.lock) {
    screenOrientation.lock('landscape').catch((err) => {
      console.warn("Orientation lock failed:", err);
    });
  }
}

function resetViewportScale() {
  // Force a slight scroll and back to trigger repaint
  window.scrollTo(0, 1);
  window.scrollTo(0, 0);
}

window.addEventListener("orientationchange", () => {
  // Wait for the layout to settle
  setTimeout(() => {
    resetViewportScale();
  }, 300);
});

function setupMobileInteraction() {
  if (!isMobileDevice()) return;

  if (needsFullscreenLandscape()) {
    const mobileWarning = document.getElementById("mobile-warning");
    mobileWarning.style.display = "block";
    setTimeout(() => mobileWarning.classList.add("show"), 10);
  }

  const onFirstTouch = () => {
    requestFullscreen();
    requestLandscape();
    document.removeEventListener("touchend", onFirstTouch);
    mobileWarning.classList.remove("show")
  };

  document.addEventListener("touchend", onFirstTouch, { passive: true });
  
  const fullscreenBtn = document.getElementById("fullscreen-button");
  fullscreenBtn.style.display = "block";

  if (fullscreenBtn) {
    fullscreenBtn.addEventListener("touchstart", (e) => {
      e.preventDefault();
      requestFullscreen();
      requestLandscape();
    }, { passive: false });
  }
}

function needsFullscreenLandscape() {
  const isMobile = isMobileDevice();
  const isFullscreen = document.fullscreenElement != null;
  const isLandscape = window.innerWidth > window.innerHeight;
  return isMobile && (!isFullscreen || !isLandscape);
}