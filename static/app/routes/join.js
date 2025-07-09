import { h } from '../../mini-framework/src/domber.js';

let localName = '';

export const JoinScreen = (state, onJoin) => 
  h('div', { id: 'join-screen', class: state.connected ? '' : 'active' }, [
    h('h1', {}, 'Bomberman DOM'),
    h('input', {
      id: 'name-input',
      placeholder: 'Enter your nickname',
      value: localName || '',
      oninput: (e) => localName = e.target.value,
    }),
    h('button', { onclick: () => onJoin(localName) }, 'Join Lobby'),
    h('p', { id: 'join-error', style: 'color:red;' }, state.errorMessage || '')
  ]);