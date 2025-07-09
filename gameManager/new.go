package gameManager

import (
	"time"

	"github.com/gorilla/websocket"
)

func NewPlayer(name, id, color string, conn *websocket.Conn) *Player {
	return &Player{
		PlayerName:    name,
		PlayerID:      id,
		Conn:          conn,
		Color:         color,
		Position:      Position{X: 0, Y: 0},
		MovementSpeed: DefaultSpeed,
		KeyPresses:    make(map[string]bool),
		Lives:         DefaultLives,
		Alive:         true,
		MaxBombCount:  1,
		Bombs:         []*Bomb{},
		PowerUps:      []*PowerUp{},
	}
}

func NewGame(players map[string]*Player) *Game {
	g := &Game{
		Players:    players,
		GMap:       NewGMap(GridWidth, GridHeight),
		CreatedAt:  time.Now(),
		TickCount:  0,
		State:      Waiting,
		Winner:     "",
		stateQueue: make(chan message, 100),
		eventQueue: make(chan message, 100),
	}

	i := 0
	for _, player := range players {
		if i >= len(PlayerStartTiles) {
			break // Support max 4 players for now
		}
		player.Position = PlayerStartTiles[i]
		player.Lives = DefaultLives
		player.MaxBombCount = 1
		player.Bombs = []*Bomb{}
		player.PowerUps = []*PowerUp{}
		player.KeyPresses = make(map[string]bool)
		i++
	}

	return g
}
