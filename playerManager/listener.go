package playerManager

import (
	"encoding/json"
	"fmt"
	"log"
)

func (pm *PlayerManager) listener() {
	for action := range pm.playerQueue {
		switch action.kind {
		case "join":
			pm.sendClientList()

		case "offline":
			delete(pm.players, action.player.PlayerName)
			content := fmt.Sprintf(`{"action": "offline", "id": "%s"}`, action.player.PlayerName)
			pm.queuePublicMessage(content)
		}
	}
}

func (pm *PlayerManager) sendClientList() {
	type data struct {
		Action     string   `json:"action"`
		AllPlayers []string `json:"allPlayers"`
	}

	d := data{Action: "join"}
	for playerName := range pm.players {
		d.AllPlayers = append(d.AllPlayers, playerName)
	}

	jsonData, err := json.Marshal(d)
	if err != nil {
		log.Println("Error marshaling data to JSON:", err)
		return
	}
	pm.queuePublicMessage(string(jsonData))
}
