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
		g.updatePlayersPosition()
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

func (g *Game) updatePlayersPosition() {
	for _, player := range g.Players {
		if len(player.KeyPresses) == 0 {
			continue
		}
		lastKey := player.KeyPresses[len(player.KeyPresses)-1]

		playerTileTop := player.Y / TileSize
		playerTileBottom := (player.Y + PlayerSize - 1) / TileSize
		playerTileLeft := player.X / TileSize
		playerTileRight := (player.X + PlayerSize - 1) / TileSize

		switch lastKey {
		case "ArrowUp", "w", "W":
			newY := player.Y - player.MovementSpeed
			player.Direction = "up"

			if newY < TopBound {
				newY = TopBound
			} else {
				newTileTop := newY / TileSize
				if g.GMap.Grid[newTileTop][playerTileLeft].Type != TileEmpty ||
					g.GMap.Grid[newTileTop][playerTileRight].Type != TileEmpty {
					newY = (newTileTop + 1) * TileSize
				}
			}
			player.Y = newY

		case "ArrowDown", "s", "S":
			newY := player.Y + player.MovementSpeed
			player.Direction = "down"

			if newY+PlayerSize > BottomBound {
				newY = BottomBound - PlayerSize
			} else {
				newTileBottom := (newY + PlayerSize - 1) / TileSize
				if g.GMap.Grid[newTileBottom][playerTileLeft].Type != TileEmpty ||
					g.GMap.Grid[newTileBottom][playerTileRight].Type != TileEmpty {
					newY = newTileBottom*TileSize - PlayerSize
				}
			}
			player.Y = newY

		case "ArrowLeft", "a", "A":
			newX := player.X - player.MovementSpeed
			player.Direction = "left"

			if newX < LeftBound {
				newX = LeftBound
			} else {
				newTileLeft := newX / TileSize
				if g.GMap.Grid[playerTileTop][newTileLeft].Type != TileEmpty ||
					g.GMap.Grid[playerTileBottom][newTileLeft].Type != TileEmpty {
					newX = (newTileLeft + 1) * TileSize
				}
			}
			player.X = newX

		case "ArrowRight", "d", "D":
			newX := player.X + player.MovementSpeed
			player.Direction = "right"

			if newX+PlayerSize > RightBound {
				newX = RightBound - PlayerSize
			} else {
				newTileRight := (newX + PlayerSize - 1) / TileSize
				if g.GMap.Grid[playerTileTop][newTileRight].Type != TileEmpty ||
					g.GMap.Grid[playerTileBottom][newTileRight].Type != TileEmpty {
					newX = newTileRight*TileSize - PlayerSize
				}
			}
			player.X = newX
		}
	}
}
