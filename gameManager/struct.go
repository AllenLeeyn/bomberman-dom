package gameManager

import (
	"sync"
	"time"

	"github.com/gorilla/websocket"
)

type GameState string

type message struct {
	Action     string `json:"action"`
	PlayerName string `json:"player_name"`
	Content    string `json:"content"`
}

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
	PlayerName    string          `json:"name"`
	PlayerID      string          `json:"-"`
	Conn          *websocket.Conn `json:"-"`
	Color         string          `json:"color"`
	Position      Position        `json:"position"`
	MovementSpeed int             `json:"movementSpeed"`
	KeyPresses    map[string]bool `json:"-"`
	Lives         int             `json:"lives"`
	Alive         bool            `json:"alive"`
	MaxBombCount  int             `json:"maxBombs"`
	Bombs         []*Bomb         `json:"bombs,omitempty"`
	PowerUps      []*PowerUp      `json:"powerUps,omitempty"`
}

type Tile struct {
	Type      string   `json:"type"`
	Position  Position `json:"position"`
	Destroyed bool     `json:"destroyed"`
}

type GMap struct {
	Width    int        `json:"width"`
	Height   int        `json:"height"`
	Grid     [][]*Tile  `json:"grid"`
	Blocks   []*Tile    `json:"blocks"`
	Walls    []*Tile    `json:"walls"`
	Bombs    []*Bomb    `json:"bombs"`
	PowerUps []*PowerUp `json:"powerUps"`
}

type Game struct {
	Players   map[string]*Player
	State     GameState
	GMap      *GMap
	CreatedAt time.Time
	TickCount int64
	Winner    string

	stateQueue chan message //broadcast to clients
	eventQueue chan message //events for game logic
	mu         sync.RWMutex
}

const (
	GridWidth      = 13
	GridHeight     = 11
	TileSize       = 48
	PlayerSize     = 42
	MapPixelWidth  = GridWidth * TileSize
	MapPixelHeight = GridHeight * TileSize

	TileEmpty = "empty"
	TileWall  = "wall"
	TileBlock = "block"
	TileFlame = "flame"

	DefaultSpeed          = 3
	DefaultLives          = 3
	DefaultBombRadius     = 2
	BombFuseDuration      = 3 * time.Second
	BombExplosionDuration = 1 * time.Second

	Waiting GameState = "waiting"
	Playing GameState = "playing"
	Ended   GameState = "ended"
)

var PlayerStartTiles = []Position{
	{X: 0, Y: 0},
	{X: GridWidth - 1, Y: 0},
	{X: 0, Y: GridHeight - 1},
	{X: GridWidth - 1, Y: GridHeight - 1},
}
