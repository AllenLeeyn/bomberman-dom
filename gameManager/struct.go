package gameManager

import (
	"bomberman-dom/shared"
	"sync"
	"time"

	"github.com/gorilla/websocket"
)

type GameState string

type message = shared.Message

type Position struct {
	X int `json:"x"`
	Y int `json:"y"`
}

type TilePosition struct {
	X int `json:"x"`
	Y int `json:"y"`
}

type Bomb struct {
	BombID        string       `json:"id"`
	PlayerName    string       `json:"by"`
	Position      TilePosition `json:"pos"`
	Radius        int          `json:"r"`
	PlacedAt      time.Time    `json:"placedAt"`
	ExplosionTime time.Time    `json:"explosionTime"`
	Exploded      bool         `json:"exploded"`
}

type PowerUp struct {
	Type     string       `json:"typ"`
	Position TilePosition `json:"pos"`
}

type Player struct {
	PlayerName    string          `json:"name"`
	PlayerID      string          `json:"-"`
	Conn          *websocket.Conn `json:"-"`
	Color         string          `json:"col"`
	Position      Position        `json:"pos"`
	Direction     string          `json:"dir"`
	MovementSpeed int             `json:"spd"`
	KeyPresses    []string        `json:"-"`
	Lives         int             `json:"lives"`
	Alive         bool            `json:"alive"`
	MaxBombCount  int             `json:"maxBombs"`
	Bombs         []*Bomb         `json:"bombs,omitempty"`
	PowerUps      []*PowerUp      `json:"powerUps,omitempty"`
}

type Tile struct {
	Type string `json:"typ"`
}

type GMap struct {
	Width    int        `json:"w"`
	Height   int        `json:"h"`
	Grid     [][]*Tile  `json:"grid"`
	Blocks   []*Tile    `json:"-"`
	Walls    []*Tile    `json:"-"`
	Bombs    []*Bomb    `json:"bombs"`
	PowerUps []*PowerUp `json:"p_ups"`
}

type Game struct {
	Action    string             `json:"action"`
	Players   map[string]*Player `json:"players"`
	State     GameState          `json:"g_state"`
	GMap      *GMap              `json:"g_map"`
	CreatedAt time.Time          `json:"created_at"`
	TickCount int64              `json:"ticks"`
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
	GridToPixel(TilePosition{X: 1, Y: 1}),
	GridToPixel(TilePosition{X: GridWidth - 2, Y: 1}),
	GridToPixel(TilePosition{X: 1, Y: GridHeight - 2}),
	GridToPixel(TilePosition{X: GridWidth - 2, Y: GridHeight - 2}),
}

func GridToPixel(pos TilePosition) Position {
	return Position{(pos.X * TileSize) + 3, (pos.Y * TileSize) + 3}
}
