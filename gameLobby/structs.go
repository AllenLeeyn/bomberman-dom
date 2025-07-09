package gameLobby

import (
	"bomberman-dom/gameManager"
	"sync"
)

type player = gameManager.Player

type message struct {
	Action     string `json:"action"`
	PlayerName string `json:"player_name"`
	Content    string `json:"content"`
}

type action struct {
	kind   string
	player *player
}

type Lobby struct {
	players     map[string]*player
	msgQueue    chan message
	playerQueue chan action
	mu          sync.RWMutex
}

// AddPlayer safely adds a player to the players map
func (l *Lobby) AddPlayer(p *player) {
	l.mu.Lock()
	defer l.mu.Unlock()
	l.players[p.PlayerName] = p
}

// RemovePlayer safely removes a player from the players map
func (l *Lobby) RemovePlayer(playerName string) {
	l.mu.Lock()
	defer l.mu.Unlock()
	delete(l.players, playerName)
}

// GetPlayer safely retrieves a player by name, returns nil if not found
func (l *Lobby) GetPlayer(playerName string) *player {
	l.mu.RLock()
	defer l.mu.RUnlock()
	return l.players[playerName]
}

// GetAllPlayerNames safely returns a slice of all player names
func (l *Lobby) GetAllPlayerNames() []string {
	l.mu.RLock()
	defer l.mu.RUnlock()
	names := make([]string, 0, len(l.players))
	for name := range l.players {
		names = append(names, name)
	}
	return names
}

// HasPlayer safely checks if a player exists by name
func (l *Lobby) HasPlayer(playerName string) bool {
	l.mu.RLock()
	defer l.mu.RUnlock()
	_, exists := l.players[playerName]
	return exists
}
