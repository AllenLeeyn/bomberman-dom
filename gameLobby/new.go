package gameLobby

import (
	"bomberman-dom/gameManager"
	"errors"
	"html"
	"log"
	"net/http"
	"strings"

	"github.com/google/uuid"
	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

// New() to create a new instance of lobby.
// Starts the listener, braodcaster and timerController
func New() *Lobby {
	l := &Lobby{
		colorSet: newColorSet(),
		players:  make(map[string]*player),

		msgQueue:    make(chan Message, 100),
		playerQueue: make(chan action, 10),
		timerCh:     make(chan timerAction, 4),
		endQueue:    make(chan struct{}, 1),
		state:       StateInLobby,
	}
	go l.listener()
	go l.broadcaster()
	go l.timerController()
	return l
}

// WebSocketUpgrade() upgrades a http request to webSocket connection
func (l *Lobby) WebSocketUpgrade(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println("Error upgrading connection: ", err)
		return
	}

	playerName := r.URL.Query().Get("name")
	name, color, err := l.validateJoinRequest(playerName)
	if err != nil {
		sendError(conn, err.Error())
		conn.Close()
		return
	}
	playerID := uuid.NewString()

	pl := gameManager.NewPlayer(name, playerID, color, conn)

	l.AddPlayer(pl)
	l.playerQueue <- action{"join", pl}
	go l.handleConnection(pl)
}

// validateJoinRequest() validates name and and check lobby status
func (l *Lobby) validateJoinRequest(name string) (string, string, error) {
	name = html.EscapeString(strings.TrimSpace(name))
	if name == "" {
		return "", "", errors.New("missing player name")
	}
	if len(name) > 8 {
		return "", "", errors.New("name too long (max 8 characters)")
	}

	if l.HasPlayer(name) {
		return "", "", errors.New("name already taken")
	}
	if l.PlayerCount() >= 4 {
		return "", "", errors.New("lobby is full")
	}
	color, ok := l.getNextAvailableColor()
	if !ok {
		return "", "", errors.New("no available colors")
	}
	return name, color, nil
}

// sendError() using webSocket.Conn
func sendError(conn *websocket.Conn, reason string) {
	message := map[string]string{
		"action": "reject",
		"reason": reason,
	}
	if err := conn.WriteJSON(message); err != nil {
		log.Println("Error sending rejection:", err)
	}
}

// queuePublicMessage() to send to all users
func (l *Lobby) queuePublicMessage(content string) {
	l.msgQueue <- Message{
		Action:     "chat",
		PlayerName: "system",
		Content:    content,
	}
}

// StartGame() create a new game instance and start it.
// Waits for end signal and queue the next game
func (l *Lobby) startGame() {
	l.game = gameManager.NewGame(l.players, l.msgQueue, l.endQueue)
	l.game.Start()

	go func() {
		<-l.endQueue
		l.timerCh <- gameEndSignal
	}()
}
