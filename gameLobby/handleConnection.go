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

		msgData := message{}
		if err := json.Unmarshal(msg, &msgData); err != nil {
			log.Printf("Invalid message format from %s", pl.PlayerName)
			continue
		} else {
			log.Printf("Received message from %s: %s", pl.PlayerName, msgData.Content)
		}
		msgData.PlayerName = pl.PlayerName

		err = l.processMessage(&msgData)
		if err != nil {
			log.Println(err)
		}
	}
	pl.Conn.Close()
	l.playerQueue <- action{"offline", pl}
}

func (l *Lobby) processMessage(msgData *message) error {
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

	// pass msgData to gameManager if action is "game"
	if msgData.Action == "game" {
		log.Printf("Game message from %s: %s", msgData.PlayerName, msgData.Content)
		return nil
	}

	l.msgQueue <- *msgData
	return nil
}

func checkMessage(message string) (bool, string) {
	message = strings.TrimSpace(message)
	if len(message) == 0 {
		return false, "Too short"
	} else if len(message) > 1000 {
		return false, "Too long"
	}
	return true, html.EscapeString(message)
}
