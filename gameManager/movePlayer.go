package gameManager

// movePlayer() if player is not dead.
func (g *Game) movePlayer(player *Player, lastKey string) {
	if player.State == PlayerDead {
		return
	}
	playerTileTop := player.Y / TileSize
	playerTileBottom := (player.Y + PlayerSize - 1) / TileSize
	playerTileLeft := player.X / TileSize
	playerTileRight := (player.X + PlayerSize - 1) / TileSize

	switch lastKey {
	case "ArrowUp", "w", "W", "up":
		g.moveUp(player, playerTileTop, playerTileLeft, playerTileRight)

	case "ArrowDown", "s", "S", "down":
		g.moveDown(player, playerTileBottom, playerTileLeft, playerTileRight)

	case "ArrowLeft", "a", "A", "left":
		g.moveLeft(player, playerTileTop, playerTileBottom, playerTileLeft)

	case "ArrowRight", "d", "D", "right":
		g.moveRight(player, playerTileTop, playerTileBottom, playerTileRight)
	}
}

// moveUp() check player newY.
// if newY enters new Tile, check boundary, check block,
// and apply slide if needed
func (g *Game) moveUp(player *Player, playerTileTop, playerTileLeft, playerTileRight int) {
	player.Direction = "u"
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
		leftBlocked := isBlockingTile(player, leftType)
		rightBlocked := isBlockingTile(player, rightType)

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
	newTileTop = newY / TileSize

	g.collectPowerUp(player, newTileTop, playerTileLeft)
}

// moveDown() check player newY.
// if newY enters new Tile, check boundary, check block,
// and apply slide if needed
func (g *Game) moveDown(player *Player, playerTileBottom, playerTileLeft, playerTileRight int) {
	player.Direction = "d"
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
		leftBlocked := isBlockingTile(player, leftType)
		rightBlocked := isBlockingTile(player, rightType)

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
	newTileBottom = (newY + PlayerSize - 1) / TileSize

	g.collectPowerUp(player, newTileBottom, playerTileLeft)
}

// moveLeft() check player newX.
// if newY enters new Tile, check boundary, check block,
// and apply slide if needed
func (g *Game) moveLeft(player *Player, playerTileTop, playerTileBottom, playerTileLeft int) {
	player.Direction = "l"
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
		topBlocked := isBlockingTile(player, topType)
		bottomBlocked := isBlockingTile(player, bottomType)

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
	newTileLeft = newX / TileSize

	g.collectPowerUp(player, playerTileTop, newTileLeft)
}

// moveRight() check player newX.
// if newY enters new Tile, check boundary, check block,
// and apply slide if needed
func (g *Game) moveRight(player *Player, playerTileTop, playerTileBottom, playerTileRight int) {
	player.Direction = "r"
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
		topBlocked := isBlockingTile(player, topType)
		bottomBlocked := isBlockingTile(player, bottomType)

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
	newTileRight = (newX + PlayerSize - 1) / TileSize

	g.collectPowerUp(player, playerTileTop, newTileRight)
}

// isBlockingTile() checks tile type with player state to determine if isBlocking
func isBlockingTile(player *Player, t string) bool {
	switch t {
	case TileWall:
		return true
	case TileBlock, TileDestroy:
		return !(player.blockPass || player.State == PlayerGhost)
	case TileBomb:
		return !(player.bombPass || player.State == PlayerGhost)
	default:
		return false
	}
}
