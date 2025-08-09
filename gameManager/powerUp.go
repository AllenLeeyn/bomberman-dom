package gameManager

import (
	"log"
	"time"
)

// collectPowerUp() checks current tile power up if any and assigns to target player
func (g *Game) collectPowerUp(player *Player, tileY, tileX int) {
	tile := g.GMap.Grid[tileY][tileX]
	if tile.Type != TileEmpty {
		return
	}

	if tile.PowUp != "" {
		log.Printf("Player %s collected power-up %s at tile (%d, %d)", player.PlayerName, tile.PowUp, tileX, tileY)

		switch tile.PowUp {
		case PowerUpBomb:
			player.MaxBombCount++
		case PowerUpFlame:
			player.Radius++
		case PowerUpSpeed:
			player.MovementSpeed += 1
		case PowerUpLiveUp:
			player.Lives++
			if player.State == PlayerGhost || player.State == PlayerGhostRespawn {
				now := time.Now()
				player.State = PlayerRespawning
				player.StateReset = now.Add(time.Millisecond * 2000)
				player.MovementSpeed = DefaultSpeed
			}
		case PowerUpBlockPass:
			player.blockPass = true
		case PowerUpBombPass:
			player.bombPass = true
		}
		log.Println(player)

		tile.PowUp = ""
	}
}
