package gameManager

/*
import (
	"encoding/json"

	"github.com/gorilla/websocket"
)

import "time"

const TickRate = time.Second / 60  // ~16.67ms per tick

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
}

func (g *Game) Broadcast(eventType string, data interface{}) {
	message := struct {
		Type string      `json:"type"`
		Data interface{} `json:"data"`
	}{
		Type: eventType,
		Data: data,
	}

	g.mu.RLock()
	defer g.mu.RUnlock()

	payload, err := json.Marshal(message)
	if err != nil {
		return
	}

	for _, player := range g.Players {
		if player.Conn != nil && player.Conn.WriteMessage != nil {
			player.Conn.WriteMessage(websocket.TextMessage, payload)
		}
	}
}
*/
