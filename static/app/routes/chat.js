import { h } from '../../framework/domber.js';

let localMessage = '';

export const LobbyScreen = (state, onSend) => 
  h('div', { id: 'lobby-screen', class: state.connected ? 'active' : '' }, [
    h('h2', {}, 'Lobby Chat'),

    // Timer display if active
    state.timerDuration > 0
      ? h('div', { id: 'timer' }, `Timer (${state.state}): ${state.timerDuration}s`)
      : h('div', { id: 'timer' }, 'Waiting for players to join...'),

    h('div', { id: 'chat-log' }, 
      state.messages.map(msg => 
        h('div', { class: 'chat-message' + (msg.system ? ' system' : '') }, 
          msg.system 
            ? `[SYSTEM] ${msg.text}`
            : [
                h('strong', { style: `color: ${getPlayerColor(state.players, msg.name)}` }, msg.name + ':'),
                ' ',
                msg.text
              ]
        )
      )
    ),

    h('input', {
      id: 'chat-input',
      placeholder: 'Type your message...',
      value: state.msgInput,
      oninput: (e) => localMessage = e.target.value,
      onkeydown: (e) => {
        if (e.key === 'Enter' && localMessage.trim()) {
          state.msgInput = localMessage;
          onSend(localMessage.trim());
          localMessage = ''; // Clear input after sending
        }
      }
    }),

    h('button', { onclick: () => {
      if (localMessage.trim()) {
        state.msgInput = localMessage;
        onSend(localMessage.trim());
        localMessage = '';
      }
    } }, 'Send'),

    h('div', { id: 'players' }, [
      h('h3', {}, 'Players:'),
      h('ul', { id: 'player-list' }, 
        state.players.map(player => 
          h('li', { style: `color: ${player.color}` }, player.name)
        )
      )
    ])
  ]);

// Helper function to get player color by name
function getPlayerColor(players, name) {
  const player = players.find(p => p.name === name);
  return player ? player.color : 'black';
}
