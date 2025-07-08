package gameManager

import (
	"github.com/gorilla/websocket"
)

type Position struct {
	X int `json:"x"`
	Y int `json:"y"`
}

type Bomb struct {
	BombID        string   `json:"bombId"`
	PlayerID      string   `json:"playerId"`
	Position      Position `json:"position"`
	Radius        int      `json:"radius"`
	PlacedAt      int64    `json:"placedAt"`
	ExplosionTime int64    `json:"explosionTime"`
	Exploded      bool     `json:"exploded"`
}

type PowerUp struct {
	Type     string   `json:"type"`
	Position Position `json:"position"`
}

type Player struct {
	PlayerName   string          `json:"name"`
	PlayerID     string          `json:"-"`
	Conn         *websocket.Conn `json:"-"`
	Position     Position        `json:"position"`
	KeyPresses   map[string]bool `json:"-"`
	Lives        int             `json:"lives"`
	MaxBombCount int             `json:"maxBombs"`
	Bombs        []*Bomb         `json:"bombs,omitempty"`
	PowerUps     []*PowerUp      `json:"powerUps,omitempty"`
}

type Game struct {
	Players  map[string]*Player
	Bombs    []*Bomb
	PowerUps []*PowerUp
}
