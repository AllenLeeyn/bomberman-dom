import { state } from "./store.js"
import { playCountdown, fadeOutLobbyMusic } from "./sound.js";
let timerInterval = null;

export function setTimerState(newState, duration) {
  if (state.state ===  'in_game') return;

  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }

  state.state = newState;
  state.timerDuration = duration;

  if (newState === 'starting' && duration > 0) {
    playCountdown(); // Play the complete countdown sequence
    fadeOutLobbyMusic(10000);
  }

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