package gameManager

import (
	"encoding/json"
	"fmt"
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
			g.stateQueue <- message{
				Content: fmt.Sprintf(`{"action":"game_end","winner":"%s"}`, g.Winner),
			}
			g.mu.Unlock()
			g.endQueue <- struct{}{}
			break
		}
		g.Action = gameUpdate
		g.updateBombs()
		g.updatePlayersAction()
		g.updateFlames()
		g.checkPlayerCollisions()
		g.TickCount++

		miniCopy := *g.Mini
		g.mu.Unlock()

		content, err := json.Marshal(miniCopy)
		if err != nil {
			log.Println("[error:abort] Error starting game:", err)
			g.mu.Unlock()
			return
		}
		g.stateQueue <- message{
			Content: string(content),
		}
	}
}

func (g *Game) CheckWinner() {
	livingPlayers := make([]string, 0, len(g.Players))

	for id, player := range g.Players {
		if player.State != PlayerDead &&
			player.State != PlayerGhost &&
			player.State != PlayerGhostRespawn {
			livingPlayers = append(livingPlayers, id)
		}
	}

	if len(livingPlayers) == 1 {
		g.State = Ended
		g.Winner = livingPlayers[0]

	} else if len(livingPlayers) == 0 {
		g.State = Ended
		g.Winner = ""
	}
}
