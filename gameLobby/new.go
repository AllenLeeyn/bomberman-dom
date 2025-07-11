package gameLobby

import (
	"bomberman-dom/gameManager"
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
		colorSet: map[string]bool{
			// "#FF1493": false,
			// "#00BFFF": false,
			// "#FFD700": false,
			// "#32CD32": false,
			// "#FF4500": false,
			// "#8A2BE2": false,
			"red":    false,
			"blue":   false,
			"green":  false,
			"yellow": false,
			"purple": false,
			"orange": false,
			"cyan":   false,
			"pink":   false,
		},
		players:     make(map[string]*player),
		msgQueue:    make(chan Message, 100),
		playerQueue: make(chan action, 10),
		timerCh:     make(chan timerAction, 10),
		endQueue:    make(chan struct{}, 1),
		state:       StateInLobby,
	}
	go l.listener()
	go l.broadcaster()
	go l.timer()
	return l
}

func (l *Lobby) WebSocketUpgrade(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println("Error upgrading connection: ", err)
		return
	}

	if state := l.GetState(); state != StateInLobby && state != StateWaiting {
		sendError(conn, "Lobby is not accepting new players")
		conn.Close()
		return
	}

	playerName := r.URL.Query().Get("name")
	if playerName == "" {
		sendError(conn, "Missing player name")
		conn.Close()
		return
	}
	if exists := l.HasPlayer(playerName); exists {
		sendError(conn, "Name already taken")
		conn.Close()
		return
	}
	if playerCount := len(l.GetAllPlayerInfos()); playerCount >= 4 {
		sendError(conn, "Lobby is full")
		conn.Close()
		return
	}
	color, ok := l.getNextAvailableColor()
	if !ok {
		sendError(conn, "No available colors")
		conn.Close()
		return
	}
	playerID := uuid.NewString()

	pl := gameManager.NewPlayer(playerName, playerID, color, conn)

	l.AddPlayer(pl)
	l.playerQueue <- action{"join", pl}
	log.Printf("Player %s connected with ID %s", pl.PlayerName, pl.PlayerID)
	go l.handleConnection(pl)
}

func (l *Lobby) queuePublicMessage(content string) {
	l.msgQueue <- Message{
		Action:     "chat",
		PlayerName: "system",
		Content:    content,
	}
}

func sendError(conn *websocket.Conn, reason string) {
	message := map[string]string{
		"action": "reject",
		"reason": reason,
	}
	if err := conn.WriteJSON(message); err != nil {
		log.Println("Error sending rejection:", err)
	}
}

func (l *Lobby) startGame() {
	l.game = gameManager.NewGame(l.players, l.msgQueue, l.endQueue)
	l.game.Start()
}
