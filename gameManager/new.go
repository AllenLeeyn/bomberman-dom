package gameManager

import (
	"encoding/json"
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
		Direction:     "down",
		MovementSpeed: DefaultSpeed,
		KeyPresses:    make(map[string]bool),
		Lives:         DefaultLives,
		Alive:         true,
		MaxBombCount:  1,
		Bombs:         []*Bomb{},
		PowerUps:      []*PowerUp{},
	}
}

func NewGame(players map[string]*Player, msgQueue chan struct{}) *Game {
	g := &Game{
		Action:     "game",
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
		player.Direction = "down"
		player.MovementSpeed = DefaultSpeed
		player.Lives = DefaultLives
		player.Alive = true
		player.MaxBombCount = 1
		player.Bombs = []*Bomb{}
		player.PowerUps = []*PowerUp{}
		player.KeyPresses = make(map[string]bool)
		i++
	}

	go g.Broadcaster()
	//go g.Listener()
	//go g.GameLoop()

	return g
}

func (g *Game) Start() {
	g.mu.Lock()
	defer g.mu.Unlock()

	if g.State != Waiting {
		return
	}

	g.State = Playing
	g.CreatedAt = time.Now()
	g.TickCount = 0
	g.Winner = ""

	content, err := json.Marshal(g)
	if err != nil {
	}
	g.stateQueue <- message{
		Action:     "game_start",
		PlayerName: "system", // Optional: specify who initiated start
		Content:    string(content),
	}
}
