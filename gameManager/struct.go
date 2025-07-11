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

type TilePosition struct {
	X int `json:"x"`
	Y int `json:"y"`
}

type Bomb struct {
	BombID        string       `json:"bombId"`
	PlayerID      string       `json:"playerId"`
	Position      TilePosition `json:"position"`
	Radius        int          `json:"radius"`
	PlacedAt      time.Time    `json:"placedAt"`
	ExplosionTime time.Time    `json:"explosionTime"`
	Exploded      bool         `json:"exploded"`
}

type PowerUp struct {
	Type     string       `json:"type"`
	Position TilePosition `json:"position"`
}

type Player struct {
	PlayerName    string          `json:"name"`
	PlayerID      string          `json:"-"`
	Conn          *websocket.Conn `json:"-"`
	Color         string          `json:"color"`
	Position      Position        `json:"position"`
	Direction     string          `json:"direction"`
	MovementSpeed int             `json:"movementSpeed"`
	KeyPresses    map[string]bool `json:"-"`
	Lives         int             `json:"lives"`
	Alive         bool            `json:"alive"`
	MaxBombCount  int             `json:"maxBombs"`
	Bombs         []*Bomb         `json:"bombs,omitempty"`
	PowerUps      []*PowerUp      `json:"powerUps,omitempty"`
}

type Tile struct {
	Type     string       `json:"type"`
	Position TilePosition `json:"position"`
}

type GMap struct {
	Width    int        `json:"width"`
	Height   int        `json:"height"`
	Grid     [][]*Tile  `json:"grid"`
	Blocks   []*Tile    `json:"blocks"`
	Walls    []*Tile    `json:"-"`
	Bombs    []*Bomb    `json:"bombs"`
	PowerUps []*PowerUp `json:"powerUps"`
}

type Game struct {
	Action    string             `json:"action"`
	Players   map[string]*Player `json:"players"`
	State     GameState          `json:"game_state"`
	GMap      *GMap              `json:"game_map"`
	CreatedAt time.Time          `json:"created_at"`
	TickCount int64              `json:"tick_count"`
	Winner    string             `json:"winner"`

	stateQueue chan message  `json:"-"` //broadcast to clients
	eventQueue chan message  `json:"-"` //events for game logic
	endQueue   chan struct{} `json:"-"`
	mu         sync.RWMutex  `json:"-"`
}

const (
	GridWidth      = 15
	GridHeight     = 13
	TileSize       = 48
	PlayerSize     = 42
	MapPixelWidth  = GridWidth * TileSize
	MapPixelHeight = GridHeight * TileSize

	TileEmpty   = "empty"
	TileWall    = "wall"
	TileBlock   = "block"
	TileBomb    = "bomb"
	TilePowerUp = "powerup"
	TileFlame   = "flame"

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
	GridToPixel(Position{X: 1, Y: 1}),
	GridToPixel(Position{X: GridWidth - 2, Y: 1}),
	GridToPixel(Position{X: 1, Y: GridHeight - 2}),
	GridToPixel(Position{X: GridWidth - 2, Y: GridHeight - 2}),
}

func GridToPixel(pos Position) Position {
	return Position{(pos.X * TileSize) + 3, (pos.Y * TileSize) + 3}
}
