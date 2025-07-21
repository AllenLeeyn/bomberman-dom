package gameLobby

import (
	"log"

	"github.com/gorilla/websocket"
)

func (l *Lobby) broadcaster() {
	for {
		msg := <-l.msgQueue

		l.mu.RLock()
		for playerID, pl := range l.players {
			if pl == nil {
				continue
			}
			//log.Printf("Sending to player ID: %s, message: %s", playerID, msg.Content)
			err := pl.Conn.WriteMessage(websocket.TextMessage, []byte(msg.Content))
			if err != nil {
				log.Printf("Error sending message to %v: %v", playerID, err)
			}
		}
		l.mu.RUnlock()
	}
}
