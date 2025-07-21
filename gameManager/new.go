package gameManager

import (
	"encoding/json"
	"log"
	"time"
)

func NewGame(players map[string]*Player, stateQueue chan message, endQueue chan struct{}) *Game {
	g := &Game{
		Players:    players,
		GMap:       NewGMap(GridWidth, GridHeight),
		CreatedAt:  time.Now(),
		TickCount:  0,
		State:      Waiting,
		Winner:     "",
		stateQueue: stateQueue,
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
			break
		}
		player.Reset(PlayerStartTiles[i][0], PlayerStartTiles[i][1])
		i++
	}

	go g.gameLoop()

	return g
}

func (g *Game) Start() {
	log.Println("game start")
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
