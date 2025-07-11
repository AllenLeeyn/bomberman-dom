package gameManager

func NewGMap(width, height int) *GMap {
	grid := make([][]*Tile, height)
	blocks := []*Tile{}
	walls := []*Tile{}

	for y := range height {
		grid[y] = make([]*Tile, width)
		for x := range width {
			pos := TilePosition{X: x, Y: y}
			tileType := TileEmpty

			// Perimeter walls and inner fixed walls
			if x == 0 || y == 0 || x == width-1 || y == height-1 || (x%2 == 0 && y%2 == 0) {
				tileType = TileWall
			} else {
				tileType = TileEmpty
			}
			tile := &Tile{Type: tileType, Position: pos}
			grid[y][x] = tile
			walls = append(walls, tile)
		}
	}

	return &GMap{
		Width:    width,
		Height:   height,
		Grid:     grid,
		Blocks:   blocks,
		Walls:    walls,
		Bombs:    []*Bomb{},
		PowerUps: []*PowerUp{},
	}
}
