package gameManager

import (
	"bomberman-dom/shared"
	"sync"
	"time"

	"github.com/gorilla/websocket"
)

type message = shared.Message

type GameState string

const (
	Waiting GameState = "waiting"
	Playing GameState = "playing"
	Ended   GameState = "ended"
)

type gameAction string

const (
	gameStart  gameAction = "game_start"
	gameUpdate gameAction = "game_update"
	gameMini   gameAction = "game_mini"
)

type PlayerState string

const (
	PlayerAlive      PlayerState = "alive"
	PlayerRespawning PlayerState = "respawning"
	PlayerDead       PlayerState = "dead"
)

type Player struct {
	PlayerName    string          `json:"name"`
	PlayerID      string          `json:"-"`
	Conn          *websocket.Conn `json:"-"`
	Color         string          `json:"col"`
	X             int             `json:"x"`
	Y             int             `json:"y"`
	Direction     string          `json:"dir"`
	MovementSpeed int             `json:"spd"`
	KeyPresses    []string        `json:"-"`
	Lives         int             `json:"lives"`
	State         PlayerState     `json:"state"`
	MaxBombCount  int             `json:"maxBombs"`
	Bombs         []*Bomb         `json:"bombs,omitempty"`
	PowerUps      []*PowerUp      `json:"powerUps,omitempty"`
}

type PlayerMini struct {
	PlayerName *string      `json:"name"`
	X          *int         `json:"x"`
	Y          *int         `json:"y"`
	Direction  *string      `json:"dir"`
	KeyPresses []string     `json:"keys_pressed"`
	Lives      *int         `json:"lives"`
	State      *PlayerState `json:"state"`
}

type Bomb struct {
	PlayerName    string    `json:"by"`
	X             int       `json:"x"`
	Y             int       `json:"y"`
	Radius        int       `json:"r"`
	PlacedAt      time.Time `json:"placedAt"`
	ExplosionTime time.Time `json:"explosionTime"`
	Exploded      bool      `json:"exploded"`
}

type BombMini struct {
	PlayerName *string `json:"by"`
	X          *int    `json:"x"`
	Y          *int    `json:"y"`
	Radius     *int    `json:"r"`
	Exploded   *bool   `json:"exploded"`
}

type PowerUp struct {
	Type string `json:"typ"`
	X    int    `json:"x"`
	Y    int    `json:"y"`
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
	Action    gameAction         `json:"action"`
	Players   map[string]*Player `json:"players"`
	State     GameState          `json:"state"`
	GMap      *GMap              `json:"map"`
	CreatedAt time.Time          `json:"created_at"`
	TickCount int64              `json:"ticks"`
	Winner    string             `json:"winner"`

	stateQueue chan message  `json:"-"` //broadcast to clients
	eventQueue chan message  `json:"-"` //events for game logic
	endQueue   chan struct{} `json:"-"`
	mu         sync.RWMutex  `json:"-"`

	Mini *MiniState `json:"-"`
}

type MiniState struct {
	Action    gameAction             `json:"action"`
	Players   map[string]*PlayerMini `json:"players"`
	Bombs     []*BombMini            `json:"bombs"`
	State     *GameState             `json:"state"`
	TickCount *int64                 `json:"ticks"`
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
	TileDestroy = "destroy"
	TilePowerUp = "powerup"
	TileFlame   = "flame"

	DefaultSpeed          = 3
	DefaultLives          = 3
	DefaultBombRadius     = 2
	BombFuseDuration      = 3 * time.Second
	BombExplosionDuration = 1 * time.Second
)

var PlayerStartTiles = [][]int{
	GridToPixel(1, 1),
	GridToPixel(GridWidth-2, 1),
	GridToPixel(1, GridHeight-2),
	GridToPixel(GridWidth-2, GridHeight-2),
}

func GridToPixel(gridX, gridY int) []int {
	return []int{(gridX * TileSize) + 3, (gridY * TileSize) + 3}
}
