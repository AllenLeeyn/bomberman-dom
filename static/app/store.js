import { createStore } from '../framework/domber.js'

export const { state, subscribe } = createStore({
  playerName: '',
  players: [],
  messages: [],
  msgInput: '',
  connected: false,
  errorMessage: '',
  state: 'in_lobby',
  timerDuration: 0,
});

const colorSet = {
  // pink: '#FF1493',
  // blue: '#3498db',
  // yellow: '#FFD700',
  // green: '#32CD32',
  // red: '#FF4500',
  // purple: '#8A2BE2',

  red: '#e74c3c',
  blue: '#3498db',
  green: '#27ae60',
  yellow: '#f1c40f',
  purple: '#9b59b6',
  orange: '#e67e22',
  cyan: '#1abc9c',
  pink: '#fd79a8',
};