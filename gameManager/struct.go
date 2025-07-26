package gameManager

import (
	"bomberman-dom/shared"
	"sync"
	"time"

	"github.com/gorilla/websocket"
)

type message = shared.Message

// gameAction to inform client what to do
type gameAction string

const (
	gameStart  gameAction = "game_start"
	gameUpdate gameAction = "game_update"
	gameMini   gameAction = "game_mini"
)

type GameState string

// gameState to keep track of game operations
const (
	Waiting GameState = "waiting"
	Playing GameState = "playing"
	Ended   GameState = "ended"
)

// player struct and const
type PlayerState string

const (
	PlayerAlive      PlayerState = "al"
	PlayerRespawning PlayerState = "rs"
	PlayerDead       PlayerState = "dd"
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
	StateReset    time.Time       `json:"-"`
	MaxBombCount  int             `json:"maxBombs"`
	Radius        int             `json:"-"`
	CurBombCount  int             `json:"curBombs,omitempty"`
	blockPass     bool            `json:"-"`
	bombPass      bool            `json:"-"`
}

type PlayerMini struct {
	X         *int    `json:"x"`
	Y         *int    `json:"y"`
	Direction *string `json:"d"`
	//KeyPresses []string     `json:"-"`
	Lives *int         `json:"l"`
	State *PlayerState `json:"s"`
}

func (p *Player) ToMini() *PlayerMini {
	return &PlayerMini{
		X:         &p.X,
		Y:         &p.Y,
		Direction: &p.Direction,
		Lives:     &p.Lives,
		State:     &p.State,
	}
}

// bomb struct and const
type Bomb struct {
	PlayerName    string    `json:"by"`
	X             int       `json:"x"`
	Y             int       `json:"y"`
	Radius        int       `json:"r"`
	PlacedAt      time.Time `json:"-"`
	ExplosionTime time.Time `json:"-"`
	Exploded      bool      `json:"e"`
}

type BombMini struct {
	X        *int  `json:"x"`
	Y        *int  `json:"y"`
	Radius   *int  `json:"r"`
	Exploded *bool `json:"e"`
}

func (b *Bomb) ToMini() *BombMini {
	return &BombMini{
		X:        &b.X,
		Y:        &b.Y,
		Radius:   &b.Radius,
		Exploded: &b.Exploded,
	}
}

// powerups struct and const
type PowerUpType string

const (
	PowerUpBomb      PowerUpType = "bombUp"
	PowerUpFlame     PowerUpType = "flameUp"
	PowerUpSpeed     PowerUpType = "speedUp"
	PowerUpBombPass  PowerUpType = "bombPass"
	PowerUpBlockPass PowerUpType = "blockPass"
	PowerUpLiveUp    PowerUpType = "liveUp"
)

var PowerUpSetting = map[PowerUpType]int{
	PowerUpBomb:      11,
	PowerUpFlame:     5,
	PowerUpSpeed:     3,
	PowerUpBombPass:  1,
	PowerUpBlockPass: 1,
	PowerUpLiveUp:    2,
}

// GetPowerSlice() creates a slice of PowerUpTypes for randomization and assignment
func GetPowerUpsSlice(counts map[PowerUpType]int) []PowerUpType {
	var powerUps []PowerUpType
	for puType, count := range counts {
		for range count {
			powerUps = append(powerUps, puType)
		}
	}
	return powerUps
}

// map struct and const
type Tile struct {
	Type       string      `json:"typ"`
	ExpireTime time.Time   `json:"-"`
	PowUp      PowerUpType `json:"p_ups"`
}

type GMap struct {
	Width  int       `json:"w"`
	Height int       `json:"h"`
	Grid   [][]*Tile `json:"grid"`
	Blocks []*Tile   `json:"-"`
	Walls  []*Tile   `json:"-"`
	Bombs  []*Bomb   `json:"bombs"`
}

// game struct and const
type Game struct {
	Action    gameAction         `json:"action"`
	Players   map[string]*Player `json:"players"`
	State     GameState          `json:"state"`
	GMap      *GMap              `json:"map"`
	CreatedAt time.Time          `json:"created_at"`
	TickCount int64              `json:"ticks"`
	Winner    string             `json:"winner"`

	stateQueue chan message  `json:"-"`
	endQueue   chan struct{} `json:"-"`
	mu         sync.RWMutex  `json:"-"`

	Mini *MiniState `json:"-"`
}

type MiniState struct {
	Action    gameAction             `json:"action"`
	Players   map[string]*PlayerMini `json:"p"`
	Bombs     []*BombMini            `json:"b"`
	State     *GameState             `json:"s"`
	TickCount *int64                 `json:"t"`
}

const (
	GridWidth           = 15
	GridHeight          = 13
	TileSize            = 48
	TileSizeHalf        = TileSize / 2
	PlayerSize          = 36
	MapPixelWidth       = GridWidth * TileSize
	MapPixelHeight      = GridHeight * TileSize
	TopBound            = TileSize
	BottomBound         = MapPixelHeight - TileSize
	LeftBound           = TileSize
	RightBound          = MapPixelWidth - TileSize
	SlideThreshold      = 24
	SlideShift          = 5
	SlideDiffCorrection = TileSize - PlayerSize

	TileEmpty   = "e"
	TileWall    = "w"
	TileBlock   = "bl"
	TileBomb    = "b"
	TileDestroy = "d"
	TilePowerUp = "p"
	TileFlame   = "f"

	DefaultBombCount      = 2
	DefaultSpeed          = 5
	DefaultLives          = 3
	DefaultBombRadius     = 2
	BombFuseDuration      = 3 * time.Second
	BombExplosionDuration = 400 * time.Millisecond
)

var PlayerStartTiles = [][]int{
	GridToPixel(1, 1),
	GridToPixel(GridWidth-2, 1),
	GridToPixel(1, GridHeight-2),
	GridToPixel(GridWidth-2, GridHeight-2),
}

var safeSpots = map[[2]int]bool{
	{1, 1}: true, {1, 2}: true, {2, 1}: true,
	{1, 12}: true, {1, 13}: true, {2, 13}: true,
	{10, 1}: true, {11, 1}: true, {11, 2}: true,
	{10, 13}: true, {11, 12}: true, {11, 13}: true,
}

func GridToPixel(gridX, gridY int) []int {
	return []int{(gridX * TileSize) + 6, (gridY * TileSize) + 6}
}
