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
			l.sendClientList("join")
			l.setTimerState()

		case "colorChange":
			l.sendClientList("colorChange")

		case "offline":
			l.RemovePlayer(action.player.PlayerName)
			content := fmt.Sprintf(`{"action": "offline", "player_name": "%s"}`, action.player.PlayerName)
			l.queuePublicMessage(content)

			if l.state == StateInGame {
				l.game.CheckWinner()
			} else {
				l.setTimerState()
			}

		default:
			log.Printf("Unknown action kind received: %s", action.kind)
		}
	}
}

func (l *Lobby) sendClientList(action string) {
	type data struct {
		Action          string   `json:"action"`
		AllPlayerNames  []string `json:"allPlayersNames"`
		AllPlayerColors []string `json:"allPlayerColors"`
	}

	d := data{Action: action}
	playerInfos := l.GetAllPlayerInfos()
	for _, info := range playerInfos {
		d.AllPlayerNames = append(d.AllPlayerNames, info[0])
		d.AllPlayerColors = append(d.AllPlayerColors, info[1])
	}

	jsonData, err := json.Marshal(d)
	if err != nil {
		log.Println("Error marshaling data to JSON:", err)
		return
	}
	l.queuePublicMessage(string(jsonData))
}
