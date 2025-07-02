package playerManager

import (
	"encoding/json"
	"fmt"
	"html"
	"log"
	"strings"
)

func (pm *PlayerManager) handleConnection(pl *player) {
	for {
		_, msg, err := pl.Conn.ReadMessage()
		if err != nil {
			log.Println("Error reading message:", err)
			break
		}

		msgData := message{}
		err = json.Unmarshal(msg, &msgData)
		if err != nil {
			log.Printf("Invalid message format")
			continue
		}
		msgData.PlayerID = pl.PlayerID

		err = pm.processMessage(&msgData)
		if err != nil {
			log.Println(err)
		}
	}
	pm.playerQueue <- action{"offline", pl}
	pl.Conn.Close()
}

func (pm *PlayerManager) processMessage(msgData *message) error {
	isValidMsg, sanitizeMsg := checkMessage(msgData.Content)
	if !isValidMsg {
		return fmt.Errorf("invalid message")
	}
	msgData.Content = sanitizeMsg

	content, err := json.Marshal(msgData)
	if err != nil {
		log.Printf("Error generating JSON: %v", err)
	}
	msgData.Content = string(content)

	pm.msgQueue <- *msgData
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
