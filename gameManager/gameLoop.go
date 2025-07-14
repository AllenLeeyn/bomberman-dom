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
		g.updatePlayersAction()
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

func (g *Game) updatePlayersAction() {
	for _, player := range g.Players {
		if len(player.KeyPresses) == 0 {
			continue
		}
		lastIndex := len(player.KeyPresses) - 1
		lastKey := player.KeyPresses[lastIndex]

		if lastKey == " " || lastKey == "Space" {
			g.placeBomb(player)

			player.KeyPresses = player.KeyPresses[:lastIndex]

			if len(player.KeyPresses) == 0 {
				continue
			}
			lastKey = player.KeyPresses[lastIndex-1]
		}
		g.movePlayer(player, lastKey)
	}
}

func (g *Game) placeBomb(player *Player) {
	tileY, tileX := g.findBombTile(player)

	if len(player.Bombs) >= player.MaxBombCount {
		return
	}
	if g.GMap.Grid[tileY][tileX].Type == TileBomb {
		return
	}
	g.GMap.Grid[tileY][tileX].Type = TileBomb
	log.Printf("Place bomb by: %s at tile X: %d, tile Y: %d\n", player.PlayerName, tileX, tileY)

	newBomb := &Bomb{
		PlayerName:    player.PlayerName,
		X:             tileX,
		Y:             tileY,
		Radius:        player.Radius,
		PlacedAt:      time.Now(),
		ExplosionTime: time.Now().Add(BombExplosionDuration),
		Exploded:      false,
	}
	player.Bombs = append(player.Bombs, newBomb)

	g.Mini.Bombs = append(g.Mini.Bombs, &BombMini{
		PlayerName: &newBomb.PlayerName,
		X:          &newBomb.X,
		Y:          &newBomb.Y,
		Radius:     &newBomb.Radius,
		Exploded:   &newBomb.Exploded,
	})

}

func (g *Game) findBombTile(player *Player) (int, int) {
	playerCenterY := player.Y + PlayerSize/2
	playerCenterX := player.X + PlayerSize/2

	return playerCenterY / TileSize, playerCenterX / TileSize
}
