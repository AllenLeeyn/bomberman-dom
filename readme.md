# 💣 Bomberman DOM

Multiplayer Bomberman-style game built **without canvas or WebGL**, powered purely by the **DOM** and a custom JavaScript framework.


## 🚀 Overview

This is a multiplayer web-based Bomberman game created using only DOM elements and the custom framework developed during the 'mini-framework' project.
Players can join in real-time, plant bombs, collect power-ups, and compete to be the last one standing — all running at a **smooth 60 FPS**.


## 🎯 Objectives

- Build a **real-time multiplayer** game using **only DOM elements**.
- Maintain **60 FPS** performance with proper use of `requestAnimationFrame`.
- Enable **2–4 players** to battle it out on a destructible grid-based map.
- Implement **real-time WebSocket-based chat** for in-game communication.


## 🎮 Game Mechanics

### 👤 Players
- **2 to 4 players** per game
- Each player starts with **3 lives**
- Starts at **each corner** of the map
- Custom nickname input at game start
### 🗺️ Map
- Fixed-size grid visible to all players
- **Indestructible walls** (static layout)
- **Randomly placed destructible blocks**
- Safe zones around player spawns

### 💥 Bombs
- Bombs explode in **4 directions**
- Explosion is blocked by walls and blocks
- Chain reactions are possible
- Only a limited number of bombs per player

### ⚡ Power-Ups
Dropped randomly from destroyed blocks:

| Power-Up     | Effect                                                  |
|--------------|---------------------------------------------------------|
| **BombUp**   | Drop 1 extra bomb at a time                             |
| **FlameUp**  | Increase explosion radius by 1 tile                     |
| **SpeedUp**  | Move faster                                             |
| **BombPass** | Walk through bombs                                      |
| **BlockPass**| Walk through destructible blocks                        |
| **LiveUp**   | Gain an extra life                                      |


## 🧠 Features

- DOM-based animations for smooth character movement and bomb explosions
- WebSocket-powered multiplayer and real-time chat
- Frame rate management via `requestAnimationFrame`
- Dynamic UI built with a custom mini-framework
- Lobby with player list, chat window, and countdown timer
- Performance measured with in-browser DevTools and runtime stats


## 🧰 Tech Stack

| Tech         | Description                                 |
|--------------|---------------------------------------------|
| Vanilla JS   | Core logic and custom rendering framework   |
| HTML/CSS     | Game UI, grid layout, and animations        |
| WebSockets   | Multiplayer sync and real-time communication|
| DOM APIs     | Movement, collision, explosion rendering    |

## 🎮 Play the Game

👉 [Click here to play Bomberman DOM](https://bomberman-dom-4lnj.onrender.com/)
