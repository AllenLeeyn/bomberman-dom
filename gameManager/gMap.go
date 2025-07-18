package gameManager

import (
	"math/rand/v2"
)

func NewGMap(width, height int) *GMap {
	grid := make([][]*Tile, height)
	blocks := []*Tile{}
	walls := []*Tile{}
	candidates := [][2]int{}

	for y := range height {
		grid[y] = make([]*Tile, width)
		for x := range width {
			tile := &Tile{Type: TileEmpty}

			// Perimeter walls and inner fixed walls
			if x == 0 || y == 0 || x == width-1 || y == height-1 || (x%2 == 0 && y%2 == 0) {
				tile.Type = TileWall
				walls = append(walls, tile)
			} else if !safeSpots[[2]int{y, x}] {
				candidates = append(candidates, [2]int{y, x})
			}

			grid[y][x] = tile
		}
	}

	rand.Shuffle(len(candidates), func(i, j int) {
		candidates[i], candidates[j] = candidates[j], candidates[i]
	})

	numBlocks := 80
	for i := 0; i < numBlocks && i < len(candidates); i++ {
		y, x := candidates[i][0], candidates[i][1]
		grid[y][x].Type = TileBlock
		blocks = append(blocks, grid[y][x])
	}
	powerUps := GetPowerUpsSlice(PowerUpSetting)

	rand.Shuffle(len(powerUps), func(i, j int) {
		powerUps[i], powerUps[j] = powerUps[j], powerUps[i]
	})

	var assignedPowerUps []*PowerUp
	for i := range powerUps {
		assignedPowerUps = append(assignedPowerUps, &PowerUp{
			Type: powerUps[i],
			X:    candidates[i][1],
			Y:    candidates[i][0],
		})
	}

	return &GMap{
		Width:    width,
		Height:   height,
		Grid:     grid,
		Blocks:   blocks,
		Walls:    walls,
		Bombs:    []*Bomb{},
		PowerUps: assignedPowerUps,
	}
}
