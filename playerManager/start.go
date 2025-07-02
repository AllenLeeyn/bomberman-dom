package playerManager

import (
	"fmt"
	"log"
	"net/http"
	"sync"

	"github.com/google/uuid"
	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

type player struct {
	PlayerName string
	PlayerID   string
	Conn       *websocket.Conn
}

type message struct {
	PlayerID string `json:"player_id"`
	Content  string `json:"content"`
}

type action struct {
	kind   string
	player *player
}

type PlayerManager struct {
	players     map[string]*player
	msgQueue    chan message
	playerQueue chan action
	mu          sync.RWMutex
}

func Start() *PlayerManager {
	pm := &PlayerManager{
		players:     make(map[string]*player),
		msgQueue:    make(chan message, 100),
		playerQueue: make(chan action, 100),
	}
	go pm.listener()
	go pm.broadcaster()
	return pm
}

func (pm *PlayerManager) WebSocketUpgrade(w http.ResponseWriter, r *http.Request) {

	playerName := r.URL.Query().Get("name")
	if playerName == "" {
		http.Error(w, "Missing player name", http.StatusBadRequest)
		return
	}

	pm.mu.RLock()
	_, exists := pm.players[playerName]
	pm.mu.RUnlock()

	if exists {
		http.Error(w, "Name already taken", http.StatusConflict)
		return
	}

	playerID := uuid.NewString()

	http.SetCookie(w, &http.Cookie{
		Name:     "playerID",
		Value:    playerID,
		Path:     "/",
		HttpOnly: true,
	})

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

	pm.mu.RLock()
	pm.players[playerName] = pl
	pm.mu.RUnlock()

	pm.playerQueue <- action{"join", pl}

	go pm.handleConnection(pl)
}

func (pm *PlayerManager) queuePublicMessage(content string) {
	pm.msgQueue <- message{
		PlayerID: "system",
		Content:  content,
	}
}

func (pm *PlayerManager) sendMessage(msg message, tgt string) error {
	client, exists := pm.players[tgt]
	if exists {
		err := client.Conn.WriteMessage(websocket.TextMessage, []byte(msg.Content))
		if err != nil {
			return fmt.Errorf("error sending message to %v: %v", client, err)
		}
	}
	return nil
}
