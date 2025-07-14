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
		X:             0,
		Y:             0,
		Direction:     "down",
		MovementSpeed: DefaultSpeed,
		KeyPresses:    []string{},
		Lives:         DefaultLives,
		State:         PlayerAlive,
		MaxBombCount:  1,
		Radius:        DefaultBombRadius,
		CurBombCount:  0,
		PowerUps:      []*PowerUp{},
	}
}

func NewPlayerMini(players map[string]*Player) map[string]*PlayerMini {
	minis := make(map[string]*PlayerMini, len(players))
	for id, p := range players {
		minis[id] = &PlayerMini{
			X:          &p.X,
			Y:          &p.Y,
			Direction:  &p.Direction,
			KeyPresses: p.KeyPresses,
			Lives:      &p.Lives,
			State:      &p.State,
		}
	}
	return minis
}

func NewGame(players map[string]*Player,
	stateQueue chan message,
	endQueue chan struct{}) *Game {
	g := &Game{
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

	g.Mini = &MiniState{
		Action:    gameMini,
		Players:   NewPlayerMini(players),
		Bombs:     []*BombMini{},
		State:     &g.State,
		TickCount: &g.TickCount,
	}

	i := 0
	for _, player := range players {
		if i >= len(PlayerStartTiles) {
			log.Println("Max for for players allowed")
			break // Support max 4 players for now
		}
		player.X, player.Y = PlayerStartTiles[i][0], PlayerStartTiles[i][1]
		player.Direction = "down"
		player.MovementSpeed = DefaultSpeed
		player.Lives = DefaultLives
		player.State = PlayerAlive
		player.MaxBombCount = 1
		player.CurBombCount = 0
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

	g.Action = gameStart
	g.State = Playing
	g.CreatedAt = time.Now()
	g.TickCount = 0
	g.Winner = ""

	content, err := json.Marshal(g)
	if err != nil {
		log.Println("[error:abort] Error starting game:", err)
		return
	}
	g.stateQueue <- message{
		Content: string(content),
	}
}
