package gameLobby

import (
	"log"

	"github.com/gorilla/websocket"
)

func (l *Lobby) broadcaster() {
	for {
		msg := <-l.msgQueue

		allPlayerNames := l.GetAllPlayerNames()
		for _, playerName := range allPlayerNames {
			pl := l.GetPlayer(playerName)
			if pl == nil {
				continue
			}
			log.Printf("Broadcasting message to %s: %s", playerName, msg.Content)
			err := pl.Conn.WriteMessage(websocket.TextMessage, []byte(msg.Content))
			if err != nil {
				log.Printf("Error sending message to %v: %v", playerName, err)
			}
		}
	}
}
