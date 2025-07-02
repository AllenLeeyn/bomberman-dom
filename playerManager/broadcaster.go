package playerManager

import (
	"log"

	"github.com/gorilla/websocket"
)

func (pm *PlayerManager) broadcaster() {
	for {
		msg := <-pm.msgQueue

		for _, player := range pm.players {
			err := player.Conn.WriteMessage(websocket.TextMessage, []byte(msg.Content))
			if err != nil {
				log.Printf("Error sending message to %v: %v", player.PlayerName, err)
			}
		}
	}
}
