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
  red: '#e74c3c',
  blue: '#3498db',
  green: '#27ae60',
  yellow: '#f1c40f',
  purple: '#9b59b6',
  orange: '#e67e22',
  cyan: '#1abc9c',
  pink: '#fd79a8',
};