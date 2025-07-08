package gameLobby

import (
	"log"
	"net/http"

	"github.com/google/uuid"
	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

func New() *Lobby {
	l := &Lobby{
		players:     make(map[string]*player),
		msgQueue:    make(chan message, 100),
		playerQueue: make(chan action, 10),
	}
	go l.listener()
	go l.broadcaster()
	return l
}

func (l *Lobby) WebSocketUpgrade(w http.ResponseWriter, r *http.Request) {

	playerName := r.URL.Query().Get("name")
	if playerName == "" {
		http.Error(w, "Missing player name", http.StatusBadRequest)
		return
	}
	if exists := l.HasPlayer(playerName); exists {
		http.Error(w, "Name already taken", http.StatusConflict)
		return
	}
	if playerCount := len(l.GetAllPlayerNames()); playerCount >= 4 {
		http.Error(w, "Game is full", http.StatusForbidden)
		return
	}
	playerID := uuid.NewString()

	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println("Error upgrading connection: ", err)
		return
	}
	pl := &player{
		playerName,
		playerID,
		conn,
	}

	l.AddPlayer(pl)
	l.playerQueue <- action{"join", pl}
	log.Printf("Player %s connected with ID %s", pl.PlayerName, pl.PlayerID)
	go l.handleConnection(pl)
}

func (l *Lobby) queuePublicMessage(content string) {
	l.msgQueue <- message{
		PlayerName: "system",
		Content:    content,
	}
}
