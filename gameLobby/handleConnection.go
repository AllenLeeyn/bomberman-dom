package gameLobby

import (
	"encoding/json"
	"fmt"
	"html"
	"log"
	"strings"

	"github.com/gorilla/websocket"
)

func (l *Lobby) handleConnection(pl *player) {
	defer func() {
		pl.Conn.Close()
		l.playerQueue <- action{"offline", pl}
	}()

	for {
		_, msg, err := pl.Conn.ReadMessage()
		if err != nil {
			if websocket.IsCloseError(err,
				websocket.CloseNormalClosure,
				websocket.CloseGoingAway) {
				log.Printf("Player %s disconnected normally", pl.PlayerName)
			} else {
				log.Println("Error reading message:", err)
			}
			break
		}

		msgData := Message{}
		if err := json.Unmarshal(msg, &msgData); err != nil {
			log.Printf("Invalid message format from %s", pl.PlayerName)
			continue
		}
		//log.Printf("Received message from %s: %s", pl.PlayerName, msgData.Content)

		msgData.PlayerName = pl.PlayerName

		switch msgData.Action {
		case "game":
			if l.game != nil {
				l.game.UpdatePlayerKeys(msgData.PlayerName, msgData.Content)
			}

		case "colorChange":
			l.processColorChange(&msgData)

		default:
			err = l.processMessage(&msgData)
			if err != nil {
				log.Println(err)
			}
		}
	}
}

func (l *Lobby) processMessage(msgData *Message) error {
	isValidMsg, sanitizeMsg := checkMessage(msgData.Content)
	if !isValidMsg {
		return fmt.Errorf("invalid message from player %s", msgData.PlayerName)
	}
	msgData.Content = sanitizeMsg

	content, err := json.Marshal(msgData)
	if err != nil {
		log.Printf("Error generating JSON: %v", err)
	}
	msgData.Content = string(content)

	l.msgQueue <- *msgData
	return nil
}

func checkMessage(message string) (bool, string) {
	message = strings.TrimSpace(message)
	if len(message) == 0 {
		return false, ""
	} else if len(message) > 1000 {
		return false, ""
	}
	return true, html.EscapeString(message)
}
