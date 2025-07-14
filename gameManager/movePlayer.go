package gameManager

func (g *Game) movePlayer(player *Player, lastKey string) {
	playerTileTop := player.Y / TileSize
	playerTileBottom := (player.Y + PlayerSize - 1) / TileSize
	playerTileLeft := player.X / TileSize
	playerTileRight := (player.X + PlayerSize - 1) / TileSize

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
			leftBlocked := g.GMap.Grid[newTileTop][playerTileLeft].Type != TileEmpty
			rightBlocked := g.GMap.Grid[newTileTop][playerTileRight].Type != TileEmpty

			if leftBlocked || rightBlocked {
				newY = (newTileTop + 1) * TileSize
				diff := player.X % TileSize

				if leftBlocked && rightBlocked {
					//do nothing
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
			leftBlocked := g.GMap.Grid[newTileBottom][playerTileLeft].Type != TileEmpty
			rightBlocked := g.GMap.Grid[newTileBottom][playerTileRight].Type != TileEmpty

			if leftBlocked || rightBlocked {
				newY = newTileBottom*TileSize - PlayerSize
				diff := player.X % TileSize

				if leftBlocked && rightBlocked {
					//do nothing
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
			topBlocked := g.GMap.Grid[playerTileTop][newTileLeft].Type != TileEmpty
			bottomBlocked := g.GMap.Grid[playerTileBottom][newTileLeft].Type != TileEmpty

			if topBlocked || bottomBlocked {
				newX = (newTileLeft + 1) * TileSize
				diff := player.Y % TileSize

				if topBlocked && bottomBlocked {
					//do nothing
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
			topBlocked := g.GMap.Grid[playerTileTop][newTileRight].Type != TileEmpty
			bottomBlocked := g.GMap.Grid[playerTileBottom][newTileRight].Type != TileEmpty

			if topBlocked || bottomBlocked {
				newX = newTileRight*TileSize - PlayerSize
				diff := player.Y % TileSize

				if topBlocked && bottomBlocked {
					//do nothing
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
