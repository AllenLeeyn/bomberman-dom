package gameManager

/*
func (g *Game) Broadcaster() {
	for msg := range g.stateQueue {
		data, err := json.Marshal(msg)
		if err != nil {
			log.Println("Failed to marshal message:", err)
			continue
		}

		g.mu.RLock()
		for _, player := range g.Players {
			if player.Conn == nil {
				continue
			}

			err := player.Conn.WriteMessage(websocket.TextMessage, data)
			if err != nil {
				log.Printf("Error sending message to %s: %v\n", player.PlayerName, err)
				player.Lives = 0
				g.eventQueue <- message{
					Action:     "player_dead",
					PlayerName: player.PlayerName,
					Content:    "disconnected",
				}
			}

			//log.Printf("Game state broadcast to %s", player.PlayerName)
		}
		g.mu.RUnlock()
	}
}
*/
