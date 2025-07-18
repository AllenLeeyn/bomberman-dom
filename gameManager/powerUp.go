package gameManager

import "log"

func (g *Game) collectPowerUp(player *Player, tileY, tileX int) {
	tile := g.GMap.Grid[tileY][tileX]

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
		}
		log.Println(player)

		// Clear the power-up from the tile after collection
		tile.PowUp = ""
	}
}
