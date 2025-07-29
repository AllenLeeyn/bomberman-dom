import { h } from "../../framework/domber.js";

let localMessage = "";

const themeColorMap = {
  red: "#FF1493",
  blue: "#00BFFF",
  green: "#2ecc71",
  yellow: "#f1c40f",
};

export const LobbyScreen = (state, onSend, onColorChange) =>
  h("div", { id: "lobby-screen", class: state.connected ? "active" : "" }, [
    // Timer display if active
    state.timerDuration > 0
      ? h(
          "div",
          { id: "timer" },
          `Timer (${state.state}): ${state.timerDuration}s`
        )
      : h("div", { id: "timer" }, "Waiting for players to join..."),
    h("div", { id: "players" }, [
      h("h3", {}, `Players: (${Object.keys(state.players || {}).length}/4)`),
      h(
        "ul",
        { id: "player-list" },
        state.players.map((player) =>{
          const color = getPlayerColor(state.players, player.name);
          const isCurrentPlayer = player.name === state.playerName;
          const style = `background-color: ${color};`;

          return h(
            "li",
            {
              style: style,
              onclick: () => {
                if (player.name === state.playerName) {
                  onColorChange();
                }
              }
            },
            isCurrentPlayer ? `⮞ ${player.name} ⮜` : player.name
          )
        })
      ),
    ]),
    h(
      "div",
      { id: "chat-log" },
      state.messages.map((msg) =>
        h(
          "div",
          { class: "chat-message" + (msg.system ? " system" : "") },
          msg.system
            ? `[SYSTEM] ${msg.text}`
            : [
                h(
                  "strong",
                  {
                    style: `color: ${getPlayerColor(state.players, msg.name)}`,
                  },
                  msg.name + ":"
                ),
                " ",
                msg.text,
              ]
        )
      )
    ),

    h("div", { class: "chat-input-row" }, [
      h("input", {
        id: "chat-input",
        placeholder: "Type your message...",
        value: state.msgInput,
        oninput: (e) => (localMessage = e.target.value),
        onkeydown: (e) => {
          if (e.key === "Enter" && localMessage.trim()) {
            state.msgInput = localMessage;
            onSend(localMessage.trim());
            localMessage = "";
          }
        },
      }),
      h(
        "button",
        {
          onclick: () => {
            if (localMessage.trim()) {
              state.msgInput = localMessage;
              onSend(localMessage.trim());
              localMessage = "";
            }
          },
        },
        "Send"
      ),
    ]),
    state.state === "starting" && state.timerDuration > 0
      ? h("div", { class: "countdown-overlay" }, [
          h("div", { class: "countdown-text" }, "Game starts in"),
          h(
            "div",
            { class: "countdown-number" },
            state.timerDuration.toString()
          ),
        ])
      : '',
  ]);

// // Helper function to get player color by name
function getPlayerColor(players, name) {
  const player = players.find((p) => p && typeof p === 'object' && p.name === name);
  const colorName = player?.color || "black";
  return themeColorMap[colorName] ?? "black";
}