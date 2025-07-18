package gameManager

func (g *Game) movePlayer(player *Player, lastKey string) {
	playerTileTop := player.Y / TileSize
	playerTileBottom := (player.Y + PlayerSize - 1) / TileSize
	playerTileLeft := player.X / TileSize
	playerTileRight := (player.X + PlayerSize - 1) / TileSize

	if player.State == PlayerDead {
		return
	}

	switch lastKey {
	case "ArrowUp", "w", "W":
		player.Direction = "up"
		newY := player.Y - player.MovementSpeed
		newTileTop := newY / TileSize
		if newTileTop == playerTileTop {
			player.Y = newY
			return
		}

		if newY < TopBound {
			newY = TopBound
		} else {
			leftType := g.GMap.Grid[newTileTop][playerTileLeft].Type
			rightType := g.GMap.Grid[newTileTop][playerTileRight].Type
			leftBlocked, rightBlocked := isBlockingTile(leftType), isBlockingTile(rightType)

			if leftBlocked || rightBlocked {
				newY = (newTileTop + 1) * TileSize
				diff := player.X % TileSize

				if leftBlocked && rightBlocked {
					//do nothing
				} else if leftBlocked && (TileSize-diff) <= SlideThreshold {
					player.X += SlideShift
				} else if rightBlocked && diff-SlideDiffCorrection <= SlideThreshold {
					player.X -= SlideShift
				}
			}
		}
		player.Y = newY

	case "ArrowDown", "s", "S":
		player.Direction = "down"
		newY := player.Y + player.MovementSpeed
		newTileBottom := (newY + PlayerSize - 1) / TileSize
		if newTileBottom == playerTileBottom {
			player.Y = newY
			return
		}

		if newY+PlayerSize > BottomBound {
			newY = BottomBound - PlayerSize
		} else {
			leftType := g.GMap.Grid[newTileBottom][playerTileLeft].Type
			rightType := g.GMap.Grid[newTileBottom][playerTileRight].Type
			leftBlocked, rightBlocked := isBlockingTile(leftType), isBlockingTile(rightType)

			if leftBlocked || rightBlocked {
				newY = newTileBottom*TileSize - PlayerSize
				diff := player.X % TileSize

				if leftBlocked && rightBlocked {
					//do nothing
				} else if leftBlocked && (TileSize-diff) <= SlideThreshold {
					player.X += SlideShift
				} else if rightBlocked && diff-SlideDiffCorrection <= SlideThreshold {
					player.X -= SlideShift
				}
			}
		}
		player.Y = newY

	case "ArrowLeft", "a", "A":
		player.Direction = "left"
		newX := player.X - player.MovementSpeed
		newTileLeft := newX / TileSize
		if newTileLeft == playerTileLeft {
			player.X = newX
			return
		}

		if newX < LeftBound {
			newX = LeftBound
		} else {
			topType := g.GMap.Grid[playerTileTop][newTileLeft].Type
			bottomType := g.GMap.Grid[playerTileBottom][newTileLeft].Type
			topBlocked, bottomBlocked := isBlockingTile(topType), isBlockingTile(bottomType)

			if topBlocked || bottomBlocked {
				newX = (newTileLeft + 1) * TileSize
				diff := player.Y % TileSize

				if topBlocked && bottomBlocked {
					//do nothing
				} else if topBlocked && (TileSize-diff) <= SlideThreshold {
					player.Y += SlideShift
				} else if bottomBlocked && (diff-SlideDiffCorrection) <= SlideThreshold {
					player.Y -= SlideShift
				}
			}
		}
		player.X = newX

	case "ArrowRight", "d", "D":
		player.Direction = "right"
		newX := player.X + player.MovementSpeed
		newTileRight := (newX + PlayerSize - 1) / TileSize
		if newTileRight == playerTileRight {
			player.X = newX
			return
		}

		if newX+PlayerSize > RightBound {
			newX = RightBound - PlayerSize
		} else {
			topType := g.GMap.Grid[playerTileTop][newTileRight].Type
			bottomType := g.GMap.Grid[playerTileBottom][newTileRight].Type
			topBlocked, bottomBlocked := isBlockingTile(topType), isBlockingTile(bottomType)

			if topBlocked || bottomBlocked {
				newX = newTileRight*TileSize - PlayerSize
				diff := player.Y % TileSize

				if topBlocked && bottomBlocked {
					//do nothing
				} else if topBlocked && (TileSize-diff) <= SlideThreshold {
					player.Y += SlideShift
				} else if bottomBlocked && (diff-SlideDiffCorrection) <= SlideThreshold {
					player.Y -= SlideShift
				}
			}
		}
		player.X = newX
	}
}

func isBlockingTile(t string) bool {
	return t == TileWall || t == TileBlock || t == TileBomb || t == TileDestroy
}
