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

func (l *Lobby) AddPlayer(p *player) {
	l.mu.Lock()
	defer l.mu.Unlock()
	l.players[p.PlayerName] = p
}

func (l *Lobby) RemovePlayer(playerName string) {
	l.mu.Lock()
	defer l.mu.Unlock()
	delete(l.players, playerName)
}

func (l *Lobby) GetPlayer(playerName string) *player {
	l.mu.RLock()
	defer l.mu.RUnlock()
	return l.players[playerName]
}

func (l *Lobby) GetAllPlayerInfos() [][]string {
	l.mu.RLock()
	defer l.mu.RUnlock()

	infos := make([][]string, 0, len(l.players))
	for _, player := range l.players {
		entry := []string{player.PlayerName, player.Color}
		infos = append(infos, entry)
	}
	return infos
}

func (l *Lobby) HasPlayer(playerName string) bool {
	l.mu.RLock()
	defer l.mu.RUnlock()
	_, exists := l.players[playerName]
	return exists
}
