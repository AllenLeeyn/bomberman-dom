package gameManager

import (
	"encoding/json"
	"log"
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
		KeyPresses:    []string{},
		Lives:         DefaultLives,
		Alive:         true,
		MaxBombCount:  1,
		Bombs:         []*Bomb{},
		PowerUps:      []*PowerUp{},
	}
}

func NewGame(players map[string]*Player,
	stateQueue chan message,
	endQueue chan struct{}) *Game {
	g := &Game{
		Action:     "game",
		Players:    players,
		GMap:       NewGMap(GridWidth, GridHeight),
		CreatedAt:  time.Now(),
		TickCount:  0,
		State:      Waiting,
		Winner:     "",
		stateQueue: stateQueue,
		eventQueue: make(chan message, 10),
		endQueue:   endQueue,
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
		player.KeyPresses = []string{}
		i++
	}

	go g.gameLoop()

	return g
}

func (g *Game) Start() {
	g.mu.Lock()
	defer g.mu.Unlock()

	if g.State != Waiting {
		return
	}

	g.Action = "game_start"
	g.State = Playing
	g.CreatedAt = time.Now()
	g.TickCount = 0
	g.Winner = ""

	content, err := json.Marshal(g)
	if err != nil {
		log.Println("[error:abort] Error starting game:", err)
		return
	}
	msg := message{
		Action:     "game_start",
		PlayerName: "system",
		Content:    string(content),
	}
	g.stateQueue <- msg
}
