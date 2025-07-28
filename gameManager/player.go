package gameManager

import (
	"encoding/json"
	"log"

	"github.com/gorilla/websocket"
)

// NewPLayer() returns a new instance
func NewPlayer(name, id, color string, conn *websocket.Conn) *Player {
	return &Player{
		PlayerName:    name,
		PlayerID:      id,
		Conn:          conn,
		Color:         color,
		X:             0,
		Y:             0,
		Direction:     "d",
		MovementSpeed: DefaultSpeed,
		KeyPresses:    []string{},
		Lives:         DefaultLives,
		State:         PlayerAlive,
		MaxBombCount:  DefaultBombCount,
		Radius:        DefaultBombRadius,
		CurBombCount:  0,
		blockPass:     false,
		bombPass:      false,
	}
}

// NewPlayerMini() return players mini state
func NewPlayerMini(players map[string]*Player) map[string]*PlayerMini {
	minis := make(map[string]*PlayerMini, len(players))
	for id, p := range players {
		minis[id] = p.ToMini()
	}
	return minis
}

// Reset() the player parameters other than name, id, conn and color
func (p *Player) Reset(startX, startY int) {
	p.X = startX
	p.Y = startY
	p.Direction = "d"
	p.MovementSpeed = DefaultSpeed
	p.KeyPresses = []string{}
	p.Lives = DefaultLives
	p.State = PlayerAlive
	p.MaxBombCount = DefaultBombCount
	p.Radius = DefaultBombRadius
	p.CurBombCount = 0
	p.blockPass = false
	p.bombPass = false
}

// UpdatePlayerKeys() based on message receive
func (g *Game) UpdatePlayerKeys(playerName string, content string) {
	var keys []string

	err := json.Unmarshal([]byte(content), &keys)
	if err != nil {
		log.Println("failed to unmarshal Content into keys array:", err)
	}
	g.mu.Lock()
	defer g.mu.Unlock()

	player, exists := g.Players[playerName]
	if !exists {
		log.Printf("UpdatePlayerKeys: player %s not found\n", playerName)
		return
	}

	player.KeyPresses = keys
}

// updatePlayersAction() based on player key presses
func (g *Game) updatePlayersAction() {
	for _, player := range g.Players {
		if len(player.KeyPresses) == 0 {
			continue
		}
		lastIndex := len(player.KeyPresses) - 1
		lastKey := player.KeyPresses[lastIndex]

		if lastKey == " " || lastKey == "Space" || lastKey == "bomb" {
			g.placeBomb(player)

			player.KeyPresses = player.KeyPresses[:lastIndex]

			if len(player.KeyPresses) == 0 {
				continue
			}
			lastKey = player.KeyPresses[lastIndex-1]
		}
		g.movePlayer(player, lastKey)
	}
}

// RemovePlayer() from game state
func (g *Game) RemovePlayer(playerName string) {
	g.mu.Lock()
	delete(g.Players, playerName)
	delete(g.Mini.Players, playerName)
	g.mu.Unlock()
}
