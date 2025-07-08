import { h } from '../../src/vdom.js';

let localMessage = '';

export const LobbyScreen = (state, onSend) => 
  h('div', { id: 'lobby-screen', class: state.connected ? 'active' : '' }, [
    h('h2', {}, 'Lobby Chat'),
    h('div', { id: 'chat-log' }, 
      state.messages.map(msg => 
        h('div', { class: 'chat-message' + (msg.system ? ' system' : '') }, 
          msg.system 
            ? `[SYSTEM] ${msg.text}`
            : [h('strong', {}, msg.name + ':'), ' ', msg.text]
        )
      )
    ),
    h('input', {
      id: 'chat-input',
      placeholder: 'Type your message...',
      value: state.msgInput,
      oninput: (e) => localMessage = e.target.value
    }),
    h('button', { onclick: () => {
      state.msgInput = localMessage;
      localMessage = '';
      onSend(state.msgInput);
    } }, 'Send'),
    h('div', { id: 'players' }, [
      h('h3', {}, 'Players:'),
      h('ul', { id: 'player-list' }, 
        state.players.map(name => h('li', {}, name))
      )
    ])
  ]);
