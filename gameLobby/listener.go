package gameLobby

import (
	"encoding/json"
	"fmt"
	"log"
)

func (l *Lobby) listener() {
	for action := range l.playerQueue {
		switch action.kind {
		case "join":
			l.sendClientList()

		case "offline":
			l.RemovePlayer(action.player.PlayerName)
			content := fmt.Sprintf(`{"action": "offline", "id": "%s"}`, action.player.PlayerName)
			l.queuePublicMessage(content)

		default:
			log.Printf("Unknown action kind received: %s", action.kind)
		}
	}
}

func (l *Lobby) sendClientList() {
	type data struct {
		Action     string   `json:"action"`
		AllPlayers []string `json:"allPlayers"`
	}

	d := data{Action: "join"}
	d.AllPlayers = append(d.AllPlayers, l.GetAllPlayerNames()...)

	jsonData, err := json.Marshal(d)
	if err != nil {
		log.Println("Error marshaling data to JSON:", err)
		return
	}
	l.queuePublicMessage(string(jsonData))
}
