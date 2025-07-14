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
				leftBlocked := g.GMap.Grid[newTileTop][playerTileLeft].Type != TileEmpty
				rightBlocked := g.GMap.Grid[newTileTop][playerTileRight].Type != TileEmpty

				if leftBlocked || rightBlocked {
					newY = (newTileTop + 1) * TileSize
					diff := player.X % TileSize

					if leftBlocked && rightBlocked {
						continue
					} else if leftBlocked && (TileSize-diff) <= SlideThreshold {
						newY = player.Y - SlideShift
						player.X += SlideShift
					} else if rightBlocked && diff-SlideDiffCorrection <= SlideThreshold {
						newY = player.Y - SlideShift
						player.X -= SlideShift
					}
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
				leftBlocked := g.GMap.Grid[newTileBottom][playerTileLeft].Type != TileEmpty
				rightBlocked := g.GMap.Grid[newTileBottom][playerTileRight].Type != TileEmpty

				if leftBlocked || rightBlocked {
					newY = newTileBottom*TileSize - PlayerSize
					diff := player.X % TileSize

					if leftBlocked && rightBlocked {
						continue
					} else if leftBlocked && (TileSize-diff) <= SlideThreshold {
						newY = player.Y + SlideShift
						player.X += SlideShift
					} else if rightBlocked && diff-SlideDiffCorrection <= SlideThreshold {
						newY = player.Y + SlideShift
						player.X -= SlideShift
					}
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
				topBlocked := g.GMap.Grid[playerTileTop][newTileLeft].Type != TileEmpty
				bottomBlocked := g.GMap.Grid[playerTileBottom][newTileLeft].Type != TileEmpty

				if topBlocked || bottomBlocked {
					newX = (newTileLeft + 1) * TileSize
					diff := player.Y % TileSize

					if topBlocked && bottomBlocked {
						continue
					} else if topBlocked && (TileSize-diff) <= SlideThreshold {
						newX = player.X - SlideShift
						player.Y += SlideShift
					} else if bottomBlocked && (diff-SlideDiffCorrection) <= SlideThreshold {
						newX = player.X - SlideShift
						player.Y -= SlideShift
					}
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
				topBlocked := g.GMap.Grid[playerTileTop][newTileRight].Type != TileEmpty
				bottomBlocked := g.GMap.Grid[playerTileBottom][newTileRight].Type != TileEmpty

				if topBlocked || bottomBlocked {
					newX = newTileRight*TileSize - PlayerSize
					diff := player.Y % TileSize

					if topBlocked && bottomBlocked {
						continue
					} else if topBlocked && (TileSize-diff) <= SlideThreshold {
						newX = player.X + SlideShift
						player.Y += SlideShift
					} else if bottomBlocked && (diff-SlideDiffCorrection) <= SlideThreshold {
						newX = player.X + SlideShift
						player.Y -= SlideShift
					}
				}
			}
			player.X = newX
		}
	}
}
