package gameManager

import (
	"log"
	"time"
)

func (g *Game) placeBomb(player *Player) {
	now := time.Now()
	tileY, tileX := g.findBombTile(player)

	if player.CurBombCount >= player.MaxBombCount ||
		player.State == PlayerRespawning {
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

	g.Mini.Bombs = append(g.Mini.Bombs, newBomb.ToMini())
}

func (g *Game) updateBombs() {
	now := time.Now()
	activeBombs := make([]*Bomb, 0)
	activeMiniBombs := make([]*BombMini, 0)

	for i, bomb := range g.GMap.Bombs {
		if bomb.Exploded {
			g.GMap.Grid[bomb.Y][bomb.X].Type = TileEmpty
			if player, ok := g.Players[bomb.PlayerName]; ok {
				player.CurBombCount--
			}
			continue
		}
		if !bomb.Exploded && (now.After(bomb.ExplosionTime)) {
			bomb.Exploded = true
			g.explodeBomb(bomb)
		}
		activeBombs = append(activeBombs, bomb)
		activeMiniBombs = append(activeMiniBombs, g.Mini.Bombs[i])
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
			if nx < 0 || ny < 0 ||
				nx >= g.GMap.Width || ny >= g.GMap.Height {
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
			} else if tile.Type == TileBomb {
				for _, otherBomb := range g.GMap.Bombs {
					if otherBomb.X == nx && otherBomb.Y == ny && !otherBomb.Exploded {
						otherBomb.Exploded = true
						g.explodeBomb(otherBomb)
						break
					}
				}
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
	for _, player := range g.Players {
		tileTop := player.Y / TileSize
		tileBottom := (player.Y + PlayerSize - 1) / TileSize
		tileLeft := player.X / TileSize
		tileRight := (player.X + PlayerSize - 1) / TileSize
		g.checkFlames(player, tileTop, tileBottom, tileLeft, tileRight)
	}
}

func (g *Game) findBombTile(player *Player) (int, int) {
	playerCenterY := player.Y + PlayerSize/2
	playerCenterX := player.X + PlayerSize/2

	switch player.Direction {
	case "u":
		playerCenterY += 9
	case "d":
		playerCenterY -= 9
	case "l":
		playerCenterX += 9
	case "r":
		playerCenterX -= 9
	}

	return playerCenterY / TileSize, playerCenterX / TileSize
}

func (g *Game) checkFlames(player *Player, tileTop, tileBottom, tileLeft, tileRight int) {
	now := time.Now()

	if player.State == PlayerRespawning && now.After(player.StateReset) {
		player.State = PlayerAlive
	}
	if player.State != PlayerAlive {
		return
	}

	isHit := g.GMap.Grid[tileTop][tileLeft].Type == TileFlame ||
		g.GMap.Grid[tileTop][tileRight].Type == TileFlame ||
		g.GMap.Grid[tileBottom][tileLeft].Type == TileFlame ||
		g.GMap.Grid[tileBottom][tileRight].Type == TileFlame

	if isHit {
		player.Lives--
		if player.Lives < 0 {
			player.State = PlayerDead
			g.CheckWinner()
			return
		}
		player.State = PlayerRespawning
		player.StateReset = now.Add(1 * time.Second)
		log.Println(player.State)
	}
}
