package gameManager

import (
	"encoding/json"
	"log"
)

func (g *Game) UpdatePlayerKeys(playerName string, content string) {
	var keys []string

	err := json.Unmarshal([]byte(content), &keys)
	if err != nil {
		log.Println("failed to unmarshal Content into keys array:", err)
	}
	g.mu.Lock()
	g.Players[playerName].KeyPresses = keys
	g.mu.Unlock()
}
