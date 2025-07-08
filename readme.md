# 🧨 Bomberman DOM

**Bomberman DOM** is a 4-player, real-time, multiplayer web game inspired by the classic Bomberman. The backend, written in Go, handles everything from serving static assets to managing real-time game state using WebSockets.

The game supports matchmaking, lobbies, real-time chat, and synchronized gameplay across clients. A custom mini-framework handles the pre-game UI (nickname entry, lobby, chat), while the game logic, animations, and state updates are tightly coupled with native browser APIs.

This project is part of the [01 Edu](https://github.com/01-edu/public/tree/master/subjects/bomberman-dom) curriculum and is designed to test your understanding of:

- Event-driven architecture
- Real-time multiplayer networking
- DOM performance and manipulation
- Client-server synchronization in game development

---

## 📁 Project Structure (WIP)

```
/bomberman-dom
├── GameLobby/
|   ├── broadcaster.go
|   ├── handleConnection.go
|   ├── listener.go
|   ├── new.go
|   └── structs.go
├── static/
|   ├── mini-framework/
|   |   ├── app/
|   |   |   └── main.js
|   |   ├── src/
|   |   |   ├── components.js
|   |   |   ├── hooks.js
|   |   |   ├── render.js
|   |   |   ├── router.js
|   |   |   ├── state.js
|   |   |   ├── utils.js
|   |   |   └── vdom.js
|   |   ├── package.json
|   |   └── index.js
|   ├── assets/
|   └── index.html
├── go.mod
├── go.sum
└── main.go
```

---

## 🚀 Project Overview

### 🧩 Tech Stack

#### Frontend
- ✅ Native JavaScript (ES6+)
- ✅ DOM-based rendering (no canvas, no libraries)
- ✅ Custom mini-framework for UI (lobby, nickname input, etc.)
- ✅ WebSocket client for multiplayer game communication

#### Backend (Go)
- ✅ HTTP server for static files
- ✅ WebSocket server (chat + game state sync)
- ✅ Authoritative game engine and state manager
- ✅ Lobby system and player session handling

---

## ✅ Task Checklist

### 🛠️ Server-Side (Go)

- [x] Serve static assets (HTML, JS, CSS, images)
- [x] Serve frontend framework files
- [x] Implement WebSocket endpoint for real-time communication
- [x] Handle player connections and disconnections
- [ ] Broadcast "start game" signal to all clients
- [ ] Run authoritative game loop on server
- [ ] Sync game state with all connected clients
- [ ] Route client actions (move, bomb, etc.) to server-side game logic

- [ ] implement playerID/ session cookie for tracking and reconnection?
---

### 💻 Client-Side (JavaScript)

#### 🧪 Pre-Game UI (using custom mini-framework)

- [ ] Implement nickname input and connection flow
- [ ] Build lobby UI with player list and chat
- [ ] Listen for "start game" signal from server

#### 🎮 Game Module (native DOM-based)

- [ ] Manage game lifecycle (init, start, stop)
- [ ] Generate map (walls, destructibles, spawn zones)
- [ ] Implement player entities (movement, input, animation)
- [ ] Handle bomb mechanics (placement, timer, explosion)
- [ ] Add power-up mechanics (pickup, apply effects)
- [ ] Detect and respond to collisions
- [ ] Sync client game state with server
- [ ] Animate and render game using the DOM
- [ ] Create event system (input, ticks, collisions, etc.)

---

### 📦 Optimization & Extras

- [ ] Use object pooling for DOM element reuse (performance)
- [ ] Build asset manager for preloading images/sounds
- [ ] Handle disconnects and reconnects gracefully
- [ ] Display scoreboard and announce winner
- [ ] Add developer tools (logging, debugging helpers)

---
