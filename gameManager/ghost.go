package gameManager

import "time"

func isOverlapping(p1, p2 *Player) bool {
	return !(p1.X+PlayerSize <= p2.X ||
		p1.X >= p2.X+PlayerSize ||
		p1.Y+PlayerSize <= p2.Y ||
		p1.Y >= p2.Y+PlayerSize)
}

func (g *Game) checkPlayerCollisions() {
	for _, ghost := range g.Players {
		if ghost.State != PlayerGhost {
			continue
		}
		for _, other := range g.Players {
			if other == ghost || other.State != PlayerAlive {
				continue
			}
			if isOverlapping(ghost, other) {
				ghost.State = PlayerRespawning
				ghost.StateReset = time.Now().Add(2 * time.Second)

				other.State = PlayerGhostRespawn
				other.StateReset = time.Now().Add(2 * time.Second)
				ghost.Lives, other.Lives = other.Lives, ghost.Lives
				ghost.MovementSpeed, other.MovementSpeed = other.MovementSpeed, ghost.MovementSpeed
			}
		}
	}
}
