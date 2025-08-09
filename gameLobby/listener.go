package gameLobby

import (
	"encoding/json"
	"fmt"
	"log"

	"github.com/gorilla/websocket"
)

// listener() listen to play action and carry out relevant actions
func (l *Lobby) listener() {
	for action := range l.playerQueue {
		switch action.kind {
		case "join":
			l.sendClientList("join")
			l.mu.Lock()
			if l.state == StateInGame {
				content, err := json.Marshal(l.game)
				if err != nil {
					log.Println("[error:abort] Error starting game:", err)
					return
				}
				err = action.player.Conn.WriteMessage(websocket.TextMessage, []byte(content))
				if err != nil {
					log.Printf("Error sending message to %v: %v", action.player.PlayerName, err)
				}
				log.Printf("Sending message to %v: %v", action.player.PlayerName, l.game)
			}
			l.mu.Unlock()
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

// sendClientList() with user name and color
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
