package gameManager

import (
	"encoding/json"
	"log"

	"github.com/gorilla/websocket"
)

/* const TickRate = time.Second / 60 // ~16.67ms per tick

func (g *Game) RunGameLoop() {
	ticker := time.NewTicker(TickRate)
	defer ticker.Stop()

	for range ticker.C {
		g.mu.Lock()
		if g.State != Playing {
			g.mu.Unlock()
			break
		}
		g.TickCount++
		stateSnapshot := g.createGameStateSnapshot()
		g.mu.Unlock()

		// Send updated game state to all players
		g.Broadcast("game_tick", stateSnapshot)
	}
} */

func (g *Game) Broadcaster() {
	for msg := range g.stateQueue {
		data, err := json.Marshal(msg)
		if err != nil {
			log.Println("Failed to marshal message:", err)
			continue
		}

		g.mu.RLock()
		for _, player := range g.Players {
			if player.Conn == nil {
				continue
			}

			err := player.Conn.WriteMessage(websocket.TextMessage, data)
			if err != nil {
				log.Printf("Error sending message to %s: %v\n", player.PlayerName, err)
				player.Lives = 0
				g.eventQueue <- message{
					Action:     "player_dead",
					PlayerName: player.PlayerName,
					Content:    "disconnected",
				}
			}

			log.Printf("Game state broadcast to %s", player.PlayerName)
		}
		g.mu.RUnlock()
	}
}
