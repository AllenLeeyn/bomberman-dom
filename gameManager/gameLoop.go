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
		g.updateBombs()
		g.updatePlayersAction()
		g.updateFlames()
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
	now := time.Now()
	tileY, tileX := g.findBombTile(player)

	if player.CurBombCount >= player.MaxBombCount {
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
		PlacedAt:      now,
		ExplosionTime: now.Add(BombExplosionDuration),
		Exploded:      false,
	}
	g.GMap.Bombs = append(g.GMap.Bombs, newBomb)
	player.CurBombCount++

	g.Mini.Bombs = append(g.Mini.Bombs, &BombMini{
		X:        &newBomb.X,
		Y:        &newBomb.Y,
		Radius:   &newBomb.Radius,
		Exploded: &newBomb.Exploded,
	})

}

func (g *Game) updateBombs() {
	now := time.Now()

	activeBombs := make([]*Bomb, 0)
	activeMiniBombs := make([]*BombMini, 0)

	for i, bomb := range g.GMap.Bombs {
		if bomb.Exploded {
			g.GMap.Grid[bomb.Y][bomb.X].Type = TileEmpty
			g.Players[bomb.PlayerName].CurBombCount--
			continue
		}
		activeBombs = append(activeBombs, bomb)
		activeMiniBombs = append(activeMiniBombs, g.Mini.Bombs[i])

		if !bomb.Exploded && (now.After(bomb.ExplosionTime)) {
			log.Println("Doom")
			bomb.Exploded = true
			g.explodeBomb(bomb)
		}
	}
	g.GMap.Bombs, g.Mini.Bombs = activeBombs, activeMiniBombs
}

func (g *Game) explodeBomb(bomb *Bomb) {
	x, y := bomb.X, bomb.Y
	Radius := bomb.Radius
	expire := time.Now().Add(BombExplosionDuration)

	g.GMap.Grid[y][x].Type = TileFlame
	g.GMap.Grid[y][x].ExpireTime = expire

	directions := []struct{ dx, dy int }{
		{0, -1}, // Up
		{0, 1},  // Down
		{-1, 0}, // Left
		{1, 0},  // Right
	}

	for _, dir := range directions {
		for i := 1; i <= Radius; i++ {
			nx := x + dir.dx*i
			ny := y + dir.dy*i

			// Check bounds
			if nx < 0 || ny < 0 || nx >= g.GMap.Width || ny >= g.GMap.Height {
				break
			}

			tile := g.GMap.Grid[ny][nx]

			if tile.Type == TileWall {
				break
			} else if tile.Type == TileBlock {
				tile.Type = TileDestroy
				tile.ExpireTime = expire
				break
			} else if tile.Type == TileEmpty || tile.Type == TilePowerUp {
				tile.Type = TileFlame
				tile.ExpireTime = expire
			}
		}
	}
}

func (g *Game) updateFlames() {
	now := time.Now()

	for y := 0; y < g.GMap.Height; y++ {
		for x := 0; x < g.GMap.Width; x++ {
			tile := g.GMap.Grid[y][x]

			if (tile.Type == TileFlame || tile.Type == TileDestroy) && now.After(tile.ExpireTime) {
				tile.Type = TileEmpty
				tile.ExpireTime = time.Time{} // reset
			}
		}
	}
}

func (g *Game) findBombTile(player *Player) (int, int) {
	playerCenterY := player.Y + PlayerSize/2
	playerCenterX := player.X + PlayerSize/2

	return playerCenterY / TileSize, playerCenterX / TileSize
}
