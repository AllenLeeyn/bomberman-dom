package gameManager

import (
	"encoding/json"
	"log"
	"time"
)

const TickRate = time.Second / 60 // ~16.67ms per tick

func (g *Game) gameLoop() {
	ticker := time.NewTicker(TickRate)
	defer ticker.Stop()

	for range ticker.C {
		g.mu.Lock()
		if g.State != Playing {
			g.mu.Unlock()
			break
		}
		g.Action = gameUpdate
		g.upatePlayersPosition()
		g.TickCount++

		content, err := json.Marshal(g.Mini)
		if err != nil {
			log.Println("[error:abort] Error starting game:", err)
			return
		}
		g.stateQueue <- message{
			Content: string(content),
		}
		g.mu.Unlock()
	}
}

func (g *Game) upatePlayersPosition() {
	for _, player := range g.Players {
		if len(player.KeyPresses) == 0 {
			continue
		}
		lastKey := player.KeyPresses[len(player.KeyPresses)-1]
		switch lastKey {
		case "ArrowUp", "w", "W":
			player.Y -= player.MovementSpeed
			player.Direction = "up"
		case "ArrowDown", "s", "S":
			player.Y += player.MovementSpeed
			player.Direction = "down"
		case "ArrowLeft", "a", "A":
			player.X -= player.MovementSpeed
			player.Direction = "left"
		case "ArrowRight", "d", "D":
			player.X += player.MovementSpeed
			player.Direction = "right"
		}
	}
}
